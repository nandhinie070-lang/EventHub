const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer: buffer,
          text: buffer.toString('utf8')
        });
      });
    });
    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Starting OD Letter Automated Verification Test ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub');
  console.log('MongoDB Connected.');

  // Find or create internal student
  let internalStudent = await User.findOne({ email: 'student@apex.edu' });
  if (!internalStudent) {
    internalStudent = await User.create({
      name: 'Nandhini Student',
      email: 'student@apex.edu',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'student',
      userType: 'internal',
      department: 'Computer Science & Engineering',
      rollNo: '21CS101',
      year: 3,
      isVerified: true
    });
  }

  // Find or create external attendee
  let externalUser = await User.findOne({ email: 'external.guest@gmail.com' });
  if (!externalUser) {
    externalUser = await User.create({
      name: 'External Guest',
      email: 'external.guest@gmail.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'student',
      userType: 'external',
      collegeName: 'External Tech Institute',
      isVerified: true
    });
  }

  // Find an approved event
  let event = await Event.findOne({ status: 'approved' });
  if (!event) {
    const org = await User.findOne({ role: 'organizer' });
    event = await Event.create({
      title: 'National Tech Symposium 2026',
      description: 'Annual National Level Tech Fest with Workshops and Paper Presentations.',
      category: 'technical',
      venue: 'Main Auditorium & CS Labs',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      registrationDeadline: new Date(Date.now() + 43200000),
      capacity: 300,
      department: 'Computer Science & Engineering',
      organizer: org ? org._id : internalStudent._id,
      status: 'approved'
    });
  }

  const internalToken = jwt.sign({ id: internalStudent._id }, JWT_SECRET, { expiresIn: '1d' });
  const externalToken = jwt.sign({ id: externalUser._id }, JWT_SECRET, { expiresIn: '1d' });

  // 1. Ensure registration for internal student exists with checkedIn = false initially
  let reg = await Registration.findOne({ event: event._id, user: internalStudent._id });
  if (!reg) {
    reg = await Registration.create({
      event: event._id,
      user: internalStudent._id,
      ticketCode: `EH-2026-TEST${Math.floor(1000 + Math.random() * 9000)}`,
      qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      checkedIn: false,
      status: 'registered'
    });
  } else {
    reg.checkedIn = false;
    reg.checkedInAt = undefined;
    await reg.save();
  }

  console.log(`[TEST 1] Internal student requests OD letter BEFORE gate check-in...`);
  let res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/registrations/od-letter/${event._id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${internalToken}`
    }
  });

  console.log(`Response status: ${res.statusCode}`);
  const json1 = JSON.parse(res.text);
  console.log(`Response message: ${json1.message}`);
  if (res.statusCode === 400 && json1.message.includes('attendance')) {
    console.log('✔ PASS: Rejected download prior to gate check-in.');
  } else {
    throw new Error(`FAIL: Expected 400 when not checked in, got ${res.statusCode}`);
  }

  // 2. External attendee tries to download OD letter
  console.log(`\n[TEST 2] External attendee tries to request OD letter...`);
  // Register external attendee
  let extReg = await Registration.findOne({ event: event._id, user: externalUser._id });
  if (!extReg) {
    extReg = await Registration.create({
      event: event._id,
      user: externalUser._id,
      ticketCode: `EH-2026-EXT${Math.floor(1000 + Math.random() * 9000)}`,
      qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      checkedIn: true,
      status: 'attended'
    });
  }

  res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/registrations/od-letter/${event._id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${externalToken}`
    }
  });

  console.log(`Response status: ${res.statusCode}`);
  const json2 = JSON.parse(res.text);
  console.log(`Response message: ${json2.message}`);
  if (res.statusCode === 403 && json2.message.includes('internal')) {
    console.log('✔ PASS: External attendee rejected with 403 Forbidden.');
  } else {
    throw new Error(`FAIL: Expected 403 for external user, got ${res.statusCode}`);
  }

  // 3. Mark internal student as checked in, then request OD letter
  console.log(`\n[TEST 3] Mark internal student as checked in and download OD letter PDF...`);
  reg.checkedIn = true;
  reg.checkedInAt = new Date();
  reg.status = 'attended';
  await reg.save();

  res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/registrations/od-letter/${event._id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${internalToken}`
    }
  });

  console.log(`Response status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Disposition: ${res.headers['content-disposition']}`);
  console.log(`Buffer length: ${res.buffer.length} bytes`);

  const pdfHeader = res.buffer.slice(0, 5).toString('ascii');
  console.log(`File magic header: "${pdfHeader}"`);

  if (res.statusCode === 200 && res.headers['content-type'].includes('application/pdf') && pdfHeader === '%PDF-') {
    console.log('✔ PASS: Valid PDF binary stream successfully generated and returned!');
  } else {
    throw new Error(`FAIL: Expected valid PDF stream, got status ${res.statusCode}`);
  }

  console.log('\n==========================================');
  console.log('ALL OD LETTER TESTS PASSED WITH 100% SUCCESS!');
  console.log('==========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});
