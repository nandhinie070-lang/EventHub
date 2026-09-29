const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Event = require('./models/Event');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026_secure';
const API_BASE = `http://127.0.0.1:${PORT}/api`;

const makeJwt = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
};

async function runTests() {
  console.log('=== STARTING VENUE CLASH DETECTION TEST SUITE ===');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub');
  console.log('Connected to MongoDB.');

  try {
    const organizer = await User.findOne({ role: 'organizer' });
    const admin = await User.findOne({ role: 'admin' });

    if (!organizer || !admin) {
      throw new Error('Organizer or admin user not found in DB');
    }

    const orgToken = makeJwt(organizer);
    const adminToken = makeJwt(admin);

    const testVenue = `Mechanical Seminar Hall Beta ${Date.now()}`;
    const baseDate = new Date('2026-11-20T09:00:00.000Z');
    const eventAStart = new Date(baseDate.getTime());
    const eventAEnd = new Date(baseDate.getTime() + 4 * 3600000); // 9:00 to 13:00

    // 1. Create Base Event A
    console.log('\n--- 1. Creating Base Event A at Venue ---');
    const eventARes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        title: 'National AI & Robotics Symposium 2026',
        description: 'Keynote and research presentations',
        category: 'Seminar',
        department: 'CSE',
        startDate: eventAStart.toISOString(),
        endDate: eventAEnd.toISOString(),
        registrationDeadline: new Date(baseDate.getTime() - 24 * 3600000).toISOString(),
        venueMode: 'offline',
        venueLocation: testVenue,
        capacity: 120,
        isPaid: false
      })
    });
    const eventAData = await eventARes.json();
    if (!eventAData.success) {
      throw new Error(`Failed to create Event A: ${eventAData.message}`);
    }
    const eventA = eventAData.event;
    console.log(`Event A created: "${eventA.title}" at "${testVenue}" [${eventAStart.toISOString()} - ${eventAEnd.toISOString()}]`);

    // Approve Event A so it is an active booking
    await Event.findByIdAndUpdate(eventA._id, { status: 'approved' });
    console.log('Event A approved.');

    // 2. Pre-Check Availability for an OVERLAPPING slot (11:00 to 15:00)
    console.log('\n--- 2. Checking Venue Clash via Pre-Check Endpoint ---');
    const overlapStart = new Date(baseDate.getTime() + 2 * 3600000); // 11:00 (overlaps with 9:00-13:00)
    const overlapEnd = new Date(baseDate.getTime() + 6 * 3600000);   // 15:00

    const precheckRes = await fetch(`${API_BASE}/events/check-venue-clash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        venueLocation: testVenue,
        venueMode: 'offline',
        startDate: overlapStart.toISOString(),
        endDate: overlapEnd.toISOString()
      })
    });
    const precheckData = await precheckRes.json();
    console.log('Precheck Status:', precheckRes.status);
    console.log('hasClash:', precheckData.hasClash);
    console.log('Conflict event title:', precheckData.conflict?.title);
    console.log('Conflict organizer:', precheckData.conflict?.organizerName);

    if (!precheckData.hasClash || !precheckData.conflict) {
      throw new Error('Expected venue clash to be detected in pre-check, but got none!');
    }
    if (precheckData.conflict.title !== 'National AI & Robotics Symposium 2026') {
      throw new Error(`Conflict title mismatch: ${precheckData.conflict.title}`);
    }
    console.log('SUCCESS: Pre-check detected clash and provided conflicting event details.');

    // 3. Block Event Creation on Overlapping Slot (Returns 409 Conflict)
    console.log('\n--- 3. Attempting to Submit Overlapping Event (Must be Blocked with 409) ---');
    const clashSubmitRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        title: 'Conflicting Student Workshop',
        description: 'Should be blocked by venue clash detection',
        category: 'Workshop',
        department: 'ECE',
        startDate: overlapStart.toISOString(),
        endDate: overlapEnd.toISOString(),
        registrationDeadline: new Date(baseDate.getTime() - 24 * 3600000).toISOString(),
        venueMode: 'offline',
        venueLocation: testVenue,
        capacity: 60,
        isPaid: false
      })
    });
    const clashSubmitData = await clashSubmitRes.json();
    console.log('Clash Submission Status:', clashSubmitRes.status);
    console.log('isClash:', clashSubmitData.isClash);
    console.log('Conflict details returned:', clashSubmitData.conflict?.title);

    if (clashSubmitRes.status !== 409 || !clashSubmitData.isClash) {
      throw new Error(`Expected 409 Conflict with isClash: true, got ${clashSubmitRes.status}`);
    }
    if (clashSubmitData.conflict?.title !== 'National AI & Robotics Symposium 2026') {
      throw new Error(`Conflicting event details not returned: ${JSON.stringify(clashSubmitData)}`);
    }
    console.log('SUCCESS: Submission blocked with 409 and conflicting event details!');

    // 4. Non-Overlapping Slot (14:00 to 18:00 at same venue)
    console.log('\n--- 4. Checking and Submitting Non-Overlapping Slot ---');
    const nonOverlapStart = new Date(baseDate.getTime() + 5 * 3600000); // 14:00 (after Event A ends at 13:00)
    const nonOverlapEnd = new Date(baseDate.getTime() + 8 * 3600000);   // 17:00

    const clearPrecheckRes = await fetch(`${API_BASE}/events/check-venue-clash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        venueLocation: testVenue,
        venueMode: 'offline',
        startDate: nonOverlapStart.toISOString(),
        endDate: nonOverlapEnd.toISOString()
      })
    });
    const clearPrecheckData = await clearPrecheckRes.json();
    console.log('Clear Precheck Status:', clearPrecheckRes.status, 'hasClash:', clearPrecheckData.hasClash);

    if (clearPrecheckData.hasClash) {
      throw new Error('Expected no clash for non-overlapping slot!');
    }

    const clearSubmitRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        title: 'Evening Hackathon Pitch Night',
        description: 'Scheduled after symposium in the same hall',
        category: 'Hackathon',
        department: 'IT',
        startDate: nonOverlapStart.toISOString(),
        endDate: nonOverlapEnd.toISOString(),
        registrationDeadline: new Date(baseDate.getTime() - 24 * 3600000).toISOString(),
        venueMode: 'offline',
        venueLocation: testVenue,
        capacity: 80,
        isPaid: false
      })
    });
    const clearSubmitData = await clearSubmitRes.json();
    console.log('Non-overlapping submission status:', clearSubmitRes.status);
    if (clearSubmitRes.status !== 201 || !clearSubmitData.success) {
      throw new Error(`Expected successful creation for clear slot, got ${clearSubmitRes.status}`);
    }
    console.log('SUCCESS: Non-overlapping event created successfully at the same venue!');

    // 5. Test Virtual/Online Mode (Online events don't occupy physical venue)
    console.log('\n--- 5. Testing Virtual Event (Online Mode Exemption) ---');
    const onlineSubmitRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        title: 'Global Online Webinar on Cloud Security',
        description: 'Held virtually via Google Meet',
        category: 'Technical',
        department: 'CSE',
        startDate: overlapStart.toISOString(),
        endDate: overlapEnd.toISOString(),
        registrationDeadline: new Date(baseDate.getTime() - 24 * 3600000).toISOString(),
        venueMode: 'online',
        venueLocation: 'https://meet.google.com/abc-defg-hij',
        capacity: 300,
        isPaid: false
      })
    });
    const onlineSubmitData = await onlineSubmitRes.json();
    console.log('Online event submission status:', onlineSubmitRes.status);
    if (onlineSubmitRes.status !== 201 || !onlineSubmitData.success) {
      throw new Error(`Expected online event to succeed, got ${onlineSubmitRes.status}`);
    }
    console.log('SUCCESS: Online event successfully permitted without physical venue clash.');

    console.log('\n======================================================');
    console.log('ALL VENUE CLASH DETECTION TESTS PASSED (100% SUCCESS)');
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
