const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Event = require('./models/Event');
const EventTemplate = require('./models/EventTemplate');
const Registration = require('./models/Registration');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const json = JSON.parse(text);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, text });
        }
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
  console.log('--- Starting Dynamic Event Templates Verification Test ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub');
  console.log('MongoDB Connected.');

  // Find admin, organizer, student
  const admin = await User.findOne({ role: 'admin' });
  const organizer = await User.findOne({ role: 'organizer' });
  const student = await User.findOne({ role: 'student' });

  const adminToken = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });
  const orgToken = jwt.sign({ id: organizer._id }, JWT_SECRET, { expiresIn: '1d' });
  const studentToken = jwt.sign({ id: student._id }, JWT_SECRET, { expiresIn: '1d' });

  // 1. Fetch templates (should auto-seed defaults if empty)
  console.log('\n[TEST 1] Fetching event templates...');
  let res = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/event-templates',
    method: 'GET'
  });

  console.log(`Status: ${res.statusCode}, Templates found: ${res.data.count}`);
  if (res.statusCode !== 200 || !res.data.templates || res.data.templates.length === 0) {
    throw new Error('FAIL: Expected templates to be seeded and returned.');
  }
  console.log('✔ PASS: Templates seeded and fetched successfully.');

  // 2. Admin creates a new dynamic template
  console.log('\n[TEST 2] Admin creates custom template with event & registration customFields...');
  const newTemplateData = {
    name: `Autonomous Robotics Challenge ${Date.now()}`,
    category: 'Technical',
    description: 'Competition for autonomous ground vehicles and drone navigation.',
    customFields: [
      {
        name: 'arenaDimensions',
        label: 'Arena Dimensions & Obstacle Count',
        type: 'text',
        required: true,
        target: 'event',
        placeholder: 'e.g. 20m x 20m grid with 12 obstacles'
      },
      {
        name: 'robotWeightClass',
        label: 'Robot Weight Classification',
        type: 'select',
        required: true,
        options: ['Lightweight (< 5kg)', 'Medium (5-15kg)', 'Heavyweight (15-30kg)'],
        target: 'registration'
      },
      {
        name: 'teamLeadContact',
        label: 'Emergency Mobile Contact',
        type: 'text',
        required: true,
        target: 'registration'
      }
    ]
  };

  res = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/event-templates',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    },
    newTemplateData
  );

  console.log(`Status: ${res.statusCode}, Message: ${res.data.message}`);
  if (res.statusCode !== 201 || !res.data.template) {
    throw new Error(`FAIL: Template creation failed with status ${res.statusCode}`);
  }
  const createdTemplate = res.data.template;
  console.log('✔ PASS: Custom template created with dynamic custom fields.');

  // 3. Organizer creates event missing required event-scoped template field
  console.log('\n[TEST 3] Organizer creates event missing required event-scoped field...');
  const baseEvent = {
    title: `Robotics Grand Prix ${Date.now()}`,
    description: 'Annual inter-college autonomous bot obstacle challenge.',
    category: 'Technical',
    department: 'Computer Science & Engineering',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 172800000).toISOString(),
    registrationDeadline: new Date(Date.now() + 43200000).toISOString(),
    venueMode: 'offline',
    venueLocation: `Robotics Arena Hall ${Date.now()}`,
    capacity: 80,
    template: createdTemplate._id,
    customFieldResponses: {} // Missing 'arenaDimensions'
  };

  res = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      }
    },
    baseEvent
  );

  console.log(`Status: ${res.statusCode}, Message: ${res.data.message}`);
  if (res.statusCode === 400 && res.data.message.includes('Arena Dimensions')) {
    console.log('✔ PASS: Rejected event creation when required template field is missing.');
  } else {
    throw new Error(`FAIL: Expected 400 validation error for missing field, got ${res.statusCode}`);
  }

  // 4. Organizer creates event WITH required event-scoped template field
  console.log('\n[TEST 4] Organizer creates event WITH required event-scoped field...');
  baseEvent.customFieldResponses = {
    arenaDimensions: '25m x 25m obstacle course'
  };

  res = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      }
    },
    baseEvent
  );

  console.log(`Status: ${res.statusCode}, Message: ${res.data.message}`);
  if (res.statusCode !== 201) {
    throw new Error(`FAIL: Event creation failed with status ${res.statusCode}`);
  }
  const createdEvent = res.data.event;
  console.log('✔ PASS: Event created successfully with dynamic template linked.');

  // Set event status to 'approved' directly for registration test
  await Event.findByIdAndUpdate(createdEvent._id, { status: 'approved' });

  // 5. Student registers for event missing required registration customField
  console.log('\n[TEST 5] Student registers for event missing required registration field...');
  res = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/registrations/register/${createdEvent._id}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    {
      customFieldResponses: {
        robotWeightClass: 'Lightweight (< 5kg)'
        // Missing 'teamLeadContact'
      }
    }
  );

  console.log(`Status: ${res.statusCode}, Message: ${res.data.message}`);
  if (res.statusCode === 400 && res.data.message.includes('Emergency Mobile Contact')) {
    console.log('✔ PASS: Registration rejected when required registration custom field is missing.');
  } else {
    throw new Error(`FAIL: Expected 400 for missing registration field, got ${res.statusCode}`);
  }

  // 6. Student registers WITH all required registration customFields
  console.log('\n[TEST 6] Student registers WITH all required registration fields...');
  res = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/registrations/register/${createdEvent._id}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    {
      customFieldResponses: {
        robotWeightClass: 'Lightweight (< 5kg)',
        teamLeadContact: '+91-9876543210'
      }
    }
  );

  console.log(`Status: ${res.statusCode}, Ticket Code: ${res.data.ticket?.ticketCode}`);
  if (res.statusCode !== 201) {
    throw new Error(`FAIL: Registration failed with status ${res.statusCode}`);
  }
  console.log('✔ PASS: Student registration confirmed with dynamic fields recorded.');

  // Verify MongoDB document
  const regDoc = await Registration.findOne({ ticketCode: res.data.ticket.ticketCode });
  console.log('Stored customFieldResponses in MongoDB:', regDoc.customFieldResponses);
  if (regDoc.customFieldResponses?.robotWeightClass && regDoc.customFieldResponses?.teamLeadContact) {
    console.log('✔ PASS: MongoDB successfully persisted dynamic custom field values!');
  } else {
    throw new Error('FAIL: Custom field responses not found in MongoDB Registration document.');
  }

  console.log('\n==========================================');
  console.log('DYNAMIC EVENT TEMPLATES TEST PASSED WITH 100% SUCCESS!');
  console.log('==========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});
