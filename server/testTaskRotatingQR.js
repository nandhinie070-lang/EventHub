const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { generateRotatingToken } = require('./utils/rotatingQr');

const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_jwt_secret_key_2026';
const API_BASE = `http://127.0.0.1:${PORT}/api`;

const makeJwt = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
};

async function runTests() {
  console.log('=== STARTING ROTATING QR ATTENDANCE TEST SUITE ===');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub');
  console.log('Connected to MongoDB.');

  try {
    // 1. Fetch Users
    const organizer = await User.findOne({ role: 'organizer' });
    const student = await User.findOne({ role: 'student' });
    const admin = await User.findOne({ role: 'admin' });

    if (!organizer || !student || !admin) {
      throw new Error('Test users (organizer/student/admin) not found in DB');
    }

    const orgToken = makeJwt(organizer);
    const studentToken = makeJwt(student);
    const adminToken = makeJwt(admin);

    console.log(`Using Organizer: ${organizer.name}, Student: ${student.name}`);

    // 2. Create Event with ACTIVE attendance window (started 10 mins ago, ends in 2 hours)
    console.log('\n--- 1. Creating Event with ACTIVE attendance window ---');
    const now = Date.now();
    const activeCreateRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        title: `Active QR Test Event ${Date.now()}`,
        description: 'Test event for 30s rotating QR code validation',
        category: 'Technical',
        department: 'CSE',
        startDate: new Date(now - 10 * 60000).toISOString(),
        endDate: new Date(now + 120 * 60000).toISOString(),
        registrationDeadline: new Date(now + 60 * 60000).toISOString(),
        venueMode: 'offline',
        venueLocation: `Hall Alpha ${Date.now()}`,
        capacity: 100,
        isPaid: false
      })
    });
    const activeCreateData = await activeCreateRes.json();
    if (!activeCreateData.success) {
      throw new Error(`Failed to create active event: ${activeCreateData.message}`);
    }
    const activeEvent = activeCreateData.event;
    console.log('Created active event:', activeEvent.title, 'ID:', activeEvent._id);

    // Approve the event
    await Event.findByIdAndUpdate(activeEvent._id, { status: 'approved' });
    console.log('Active event approved.');

    // 3. Student registers for the active event
    console.log('\n--- 2. Student Registers for Active Event ---');
    const regRes = await fetch(`${API_BASE}/registrations/register/${activeEvent._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    const regData = await regRes.json();
    if (!regData.success) {
      throw new Error(`Registration failed: ${regData.message}`);
    }
    const ticket = regData.ticket;
    console.log('Registration complete! TicketCode:', ticket.ticketCode);

    // 4. Test GET /ticket/:ticketCode/rotating-qr
    console.log('\n--- 3. Fetching 30s Rotating QR Pass ---');
    const rotatingRes = await fetch(
      `${API_BASE}/registrations/ticket/${ticket.ticketCode}/rotating-qr`,
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    const rotatingData = await rotatingRes.json();
    console.log('Rotating QR Response status:', rotatingRes.status);
    console.log('Token format:', rotatingData.token);
    console.log('Expires in seconds:', rotatingData.expiresInSeconds);
    console.log('QR Code data URL present:', rotatingData.qrCodeDataUrl?.startsWith('data:image/png;base64,'));
    console.log('Attendance window isOpen:', rotatingData.event?.attendanceWindow?.isOpen);

    if (!rotatingData.token?.startsWith('RQR-')) {
      throw new Error('Rotating token does not start with RQR- prefix');
    }
    if (!rotatingData.qrCodeDataUrl) {
      throw new Error('QR code data URL missing');
    }
    if (rotatingData.event?.attendanceWindow?.isOpen !== true) {
      throw new Error('Expected attendance window to be open for active event');
    }
    console.log('SUCCESS: GET /ticket/:ticketCode/rotating-qr returns valid 30s token & QR code');

    // 5. Test scan rejection with an EXPIRED rotating token (simulating screenshot)
    console.log('\n--- 4. Testing Rejection of EXPIRED Rotating Token (Screenshot Prevention) ---');
    // Generate token from 5 minutes ago (10 windows ago)
    const oldTimestamp = Date.now() - 300000;
    const expiredTokenData = generateRotatingToken(ticket.ticketCode, oldTimestamp);
    console.log('Generated simulated 5-minute-old token:', expiredTokenData.token);

    const expiredScanRes = await fetch(`${API_BASE}/registrations/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        token: expiredTokenData.token,
        eventId: activeEvent._id
      })
    });
    const expiredScanData = await expiredScanRes.json();
    console.log('Expired scan status:', expiredScanRes.status, 'Data:', expiredScanData);

    if (expiredScanRes.status === 400 && expiredScanData.isExpired) {
      console.log('SUCCESS: Expired rotating token correctly rejected with 400 and isExpired: true!');
    } else {
      throw new Error(`Expected expired token to be rejected with isExpired: true, got ${expiredScanRes.status}`);
    }

    // 6. Test scan rejection OUTSIDE attendance window
    console.log('\n--- 5. Testing Rejection OUTSIDE Attendance Window ---');
    const futureStart = new Date(Date.now() + 86400000); // 24 hours from now
    const futureEnd = new Date(Date.now() + 90000000);
    const futureEventRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        title: `Future Event ${Date.now()}`,
        description: 'Event in the future for window testing',
        category: 'Workshop',
        department: 'ECE',
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        registrationDeadline: futureStart.toISOString(),
        venueMode: 'offline',
        venueLocation: `Lab Future ${Date.now()}`,
        capacity: 50,
        isPaid: false
      })
    });
    const futureEventData = await futureEventRes.json();
    const futureEvent = futureEventData.event;
    await Event.findByIdAndUpdate(futureEvent._id, { status: 'approved' });

    const futureRegRes = await fetch(`${API_BASE}/registrations/register/${futureEvent._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    const futureRegData = await futureRegRes.json();
    const futureTicket = futureRegData.ticket;

    // Generate fresh rotating token for future ticket
    const freshFutureToken = generateRotatingToken(futureTicket.ticketCode).token;

    const futureScanRes = await fetch(`${API_BASE}/registrations/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        token: freshFutureToken,
        eventId: futureEvent._id
      })
    });
    const futureScanData = await futureScanRes.json();
    console.log('Future event scan status:', futureScanRes.status, 'Data:', futureScanData);

    if (futureScanRes.status === 400 && futureScanData.isOutsideWindow) {
      console.log('SUCCESS: Scan outside attendance window correctly rejected with 400 and isOutsideWindow: true!');
    } else {
      throw new Error(`Expected future scan to be rejected with isOutsideWindow: true, got ${futureScanRes.status}`);
    }

    // 7. Successful Check-in with fresh live token on active event
    console.log('\n--- 6. Successful Check-in with FRESH Rotating Token ---');
    const freshActiveToken = generateRotatingToken(ticket.ticketCode).token;
    const checkInSuccessRes = await fetch(`${API_BASE}/registrations/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        token: freshActiveToken,
        eventId: activeEvent._id
      })
    });
    const checkInSuccessData = await checkInSuccessRes.json();
    console.log('Check-in status:', checkInSuccessRes.status);
    console.log('Message:', checkInSuccessData.message);
    console.log('Checked in attendee:', checkInSuccessData.attendee?.name);

    if (checkInSuccessRes.status !== 200 || !checkInSuccessData.success) {
      throw new Error(`Expected successful check-in, got ${checkInSuccessRes.status}`);
    }
    console.log('SUCCESS: Valid 30s rotating token checked in attendee!');

    // 8. Re-scan check (Must be rejected with alreadyCheckedIn: true)
    console.log('\n--- 7. Re-scan Attendance Check ---');
    const rescanRes = await fetch(`${API_BASE}/registrations/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        token: freshActiveToken,
        eventId: activeEvent._id
      })
    });
    const rescanData = await rescanRes.json();
    console.log('Rescan status:', rescanRes.status, 'Data:', rescanData);

    if (rescanRes.status === 400 && rescanData.alreadyCheckedIn) {
      console.log('SUCCESS: Duplicate scan correctly rejected with alreadyCheckedIn: true!');
    } else {
      throw new Error(`Expected duplicate check-in to be rejected with alreadyCheckedIn: true`);
    }

    console.log('\n======================================================');
    console.log('ALL ROTATING QR ATTENDANCE TESTS PASSED (100% SUCCESS)');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\nTEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
