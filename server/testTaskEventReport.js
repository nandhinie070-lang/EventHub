const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const FoodCoupon = require('./models/FoodCoupon');
const Feedback = require('./models/Feedback');
const Issue = require('./models/Issue');

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
  console.log('--- Starting Post-Event Report PDF Automated Verification Test ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub');
  console.log('MongoDB Connected.');

  // Find or create organizer
  let organizer = await User.findOne({ role: 'organizer' });
  if (!organizer) {
    organizer = await User.create({
      name: 'Dr. Jane Organizer',
      email: 'organizer@apex.edu',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'organizer',
      userType: 'internal',
      department: 'Computer Science & Engineering',
      isVerified: true
    });
  }

  // Find or create student (unauthorized)
  let student = await User.findOne({ role: 'student' });
  if (!student) {
    student = await User.create({
      name: 'Student Attendee',
      email: 'student.attendee@apex.edu',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'student',
      userType: 'internal',
      department: 'Computer Science & Engineering',
      rollNo: '21CS999',
      isVerified: true
    });
  }

  // Find or create admin
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: 'admin@apex.edu',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'admin',
      userType: 'internal',
      department: 'Administration',
      isVerified: true
    });
  }

  // Find or create an approved event belonging to organizer
  let event = await Event.findOne({ organizer: organizer._id, status: 'approved' });
  if (!event) {
    event = await Event.create({
      title: 'AI & Cloud Computing Summit 2026',
      description: 'Comprehensive annual technical summit on Next-Gen Generative AI and Cloud Architectures.',
      category: 'technical',
      venue: 'Dr. APJ Abdul Kalam Auditorium',
      startDate: new Date(Date.now() - 172800000), // Concluded event
      endDate: new Date(Date.now() - 86400000),
      registrationDeadline: new Date(Date.now() - 259200000),
      capacity: 250,
      department: 'Computer Science & Engineering',
      organizer: organizer._id,
      status: 'approved'
    });
  }

  // Seed some registrations
  const regCount = await Registration.countDocuments({ event: event._id });
  if (regCount < 3) {
    await Registration.create([
      {
        event: event._id,
        user: student._id,
        ticketCode: 'EH-2026-REP01',
        qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        checkedIn: true,
        checkedInAt: new Date(),
        status: 'attended'
      },
      {
        event: event._id,
        user: organizer._id,
        ticketCode: 'EH-2026-REP02',
        qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        checkedIn: false,
        status: 'registered'
      }
    ]);
  }

  // Seed food coupons
  const couponCount = await FoodCoupon.countDocuments({ event: event._id });
  if (couponCount < 2) {
    const reg = await Registration.findOne({ event: event._id, user: student._id });
    await FoodCoupon.create([
      {
        event: event._id,
        user: student._id,
        registration: reg._id,
        couponType: 'lunch',
        couponCode: `LUNCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        isRedeemed: true,
        redeemedAt: new Date()
      },
      {
        event: event._id,
        user: student._id,
        registration: reg._id,
        couponType: 'refreshment',
        couponCode: `REFR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        isRedeemed: false
      }
    ]);
  }

  // Seed feedback
  const fbCount = await Feedback.countDocuments({ event: event._id });
  if (fbCount === 0) {
    const reg = await Registration.findOne({ event: event._id, user: student._id });
    await Feedback.create({
      event: event._id,
      user: student._id,
      registration: reg._id,
      rating: 5,
      comment: 'Superbly managed sessions! The live demos and speaker Q&A were exceptional.'
    });
  }

  // Seed issues
  const issueCount = await Issue.countDocuments({ event: event._id });
  if (issueCount === 0) {
    await Issue.create([
      {
        event: event._id,
        reportedBy: student._id,
        category: 'audio-visual',
        description: 'Microphone feedback in rear wing.',
        stage: 'Resolved',
        slaDeadline: new Date(Date.now() + 1800000),
        isEscalated: false
      },
      {
        event: event._id,
        reportedBy: student._id,
        category: 'food',
        description: 'Lunch counter queue management.',
        stage: 'In Progress',
        slaDeadline: new Date(Date.now() - 3600000),
        isEscalated: true,
        escalationReason: 'SLA exceeded'
      }
    ]);
  }

  const organizerToken = jwt.sign({ id: organizer._id }, JWT_SECRET, { expiresIn: '1d' });
  const studentToken = jwt.sign({ id: student._id }, JWT_SECRET, { expiresIn: '1d' });
  const adminToken = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });

  // TEST 1: Unauthorized Student attempt
  console.log('[TEST 1] Unauthorized student attempts to download Event Report PDF...');
  let res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/events/${event._id}/report-pdf`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${studentToken}`
    }
  });

  console.log(`Response status: ${res.statusCode}`);
  const json1 = JSON.parse(res.text);
  console.log(`Message: ${json1.message}`);
  if (res.statusCode === 403) {
    console.log('✔ PASS: Unauthorized student blocked with 403 Forbidden.');
  } else {
    throw new Error(`FAIL: Expected 403, got ${res.statusCode}`);
  }

  // TEST 2: Organizer downloads report
  console.log('\n[TEST 2] Event Organizer downloads Event Report PDF...');
  res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/events/${event._id}/report-pdf`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${organizerToken}`
    }
  });

  console.log(`Response status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Disposition: ${res.headers['content-disposition']}`);
  console.log(`PDF Buffer size: ${res.buffer.length} bytes`);

  const magic = res.buffer.slice(0, 5).toString('ascii');
  console.log(`Magic header: "${magic}"`);

  if (res.statusCode === 200 && res.headers['content-type'].includes('application/pdf') && magic === '%PDF-') {
    console.log('✔ PASS: Organizer successfully generated and received valid PDF report!');
  } else {
    throw new Error(`FAIL: Expected 200 PDF stream, got ${res.statusCode}`);
  }

  // TEST 3: Admin downloads report
  console.log('\n[TEST 3] Institutional Admin downloads Event Report PDF...');
  res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/events/${event._id}/report-pdf`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });

  console.log(`Response status: ${res.statusCode}`);
  if (res.statusCode === 200 && res.buffer.slice(0, 5).toString('ascii') === '%PDF-') {
    console.log('✔ PASS: Administrator successfully authorized and generated event report PDF!');
  } else {
    throw new Error(`FAIL: Admin expected 200 PDF, got ${res.statusCode}`);
  }

  console.log('\n==========================================');
  console.log('ALL EVENT REPORT PDF TESTS PASSED WITH 100% SUCCESS!');
  console.log('==========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
