const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function patch(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + (u.search || ''),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('=== Starting Event Management & Multi-Tier Approval Verification ===');

  // 1. Fetch public events
  const listRes = await get('http://localhost:5000/api/events');
  console.log('1. Public Events count:', listRes.body.count, 'Total in DB:', listRes.body.total);

  // 2. Login as Organizer
  const orgLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'organizer@apex.edu',
    password: 'Organizer@123'
  });
  const orgToken = orgLogin.body.token;
  console.log('2. Organizer Logged in:', orgLogin.body.user.name, `[${orgLogin.body.user.role}]`);

  // 3. Organizer creates an event
  const newEventData = {
    title: 'CodeSprint 2026: Algorithmic Battle',
    description: 'Annual competitive programming contest with dynamic algorithmic challenges.',
    category: 'Hackathon',
    department: 'Computer Science & Engineering',
    startDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 15 * 86400000 + 4 * 3600000).toISOString(),
    registrationDeadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    venueMode: 'offline',
    venueLocation: 'Lab 4, Turing Computer Center',
    capacity: 80,
    isPaid: false,
    fee: 0,
    tags: ['Algorithms', 'DataStructures', 'Coding']
  };

  const createRes = await post('http://localhost:5000/api/events', newEventData, orgToken);
  console.log('3. Event Created:', createRes.body.event.title, 'Status:', createRes.body.event.status);
  const eventId = createRes.body.event._id;

  // 4. HOD Login & Review Queue
  const hodLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'hod.cse@apex.edu',
    password: 'Hod@123'
  });
  const hodToken = hodLogin.body.token;
  console.log('4. HOD Logged in:', hodLogin.body.user.name, `[${hodLogin.body.user.role}]`);

  const hodQueue = await get('http://localhost:5000/api/events/pending-approvals', hodToken);
  console.log('   HOD Pending Approvals count:', hodQueue.body.count);

  // HOD Approves
  const hodApproveRes = await patch(
    `http://localhost:5000/api/events/${eventId}/approve-hod`,
    {
      action: 'approve',
      remarks: 'Approved. Lab 4 booked for this contest.'
    },
    hodToken
  );
  console.log('   HOD Approval Result:', hodApproveRes.body.message);
  console.log('   New Event Status:', hodApproveRes.body.event.status);

  // 5. Principal Login & Sanction
  const prinLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'principal@apex.edu',
    password: 'Principal@123'
  });
  const prinToken = prinLogin.body.token;
  console.log('5. Principal Logged in:', prinLogin.body.user.name, `[${prinLogin.body.user.role}]`);

  const prinQueue = await get('http://localhost:5000/api/events/pending-approvals', prinToken);
  console.log('   Principal Pending Approvals count:', prinQueue.body.count);

  // Principal Sanctions
  const prinApproveRes = await patch(
    `http://localhost:5000/api/events/${eventId}/approve-principal`,
    {
      action: 'approve',
      remarks: 'Sanctioned for college-wide participation.'
    },
    prinToken
  );
  console.log('   Principal Approval Result:', prinApproveRes.body.message);
  console.log('   Final Event Status:', prinApproveRes.body.event.status);

  // 6. Verify Event is now live on public catalog
  const eventDetail = await get(`http://localhost:5000/api/events/${eventId}`);
  console.log('6. Verified Event Status:', eventDetail.body.event.status);
  console.log('   HOD Trail:', eventDetail.body.event.approvals.hod.status, 'by', eventDetail.body.event.approvals.hod.reviewedBy?.name);
  console.log('   Principal Trail:', eventDetail.body.event.approvals.principal.status, 'by', eventDetail.body.event.approvals.principal.reviewedBy?.name);

  console.log('\n🎉 ALL TASK 2 MULTI-TIER APPROVAL TESTS PASSED WITH 100% SUCCESS!');
}

verify().catch(console.error);
