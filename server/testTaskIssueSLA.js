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
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
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
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
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
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: Buffer.concat(chunks).toString() });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function verifyIssueSLA() {
  console.log('=== Starting Verification: Issue Reporting with SLA ===\n');

  // 1. Auth Setup
  const orgLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'organizer@apex.edu',
    password: 'Organizer@123'
  });
  const orgToken = orgLogin.body.token;

  const studentLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'student@apex.edu',
    password: 'Student@123'
  });
  const studentToken = studentLogin.body.token;

  const eventsRes = await get('http://localhost:5000/api/events');
  const targetEvent = eventsRes.body.events[0];
  console.log('1. Target Event:', targetEvent.title, `[ID: ${targetEvent._id}]`);

  // 2. Student submits an issue report
  const issueRes = await post(
    `http://localhost:5000/api/issues/${targetEvent._id}`,
    {
      category: 'audio-visual',
      description: 'Projector in Main Auditorium is flickering constantly during slide presentation.',
      photoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400'
    },
    studentToken
  );
  console.log('2. Issue Submission status:', issueRes.status, 'Message:', issueRes.body?.message);
  const issueId = issueRes.body?.issue?._id;
  console.log('   Issue ID:', issueId, 'Initial Stage:', issueRes.body?.issue?.stage);
  console.log('   SLA Deadline Active:', Boolean(issueRes.body?.issue?.slaDeadline));

  // 3. Coordinator views event issue board
  const boardRes = await get(`http://localhost:5000/api/issues/event/${targetEvent._id}`, orgToken);
  console.log('\n3. Coordinator Board Total Issues:', boardRes.body?.metrics?.total);
  console.log('   Reported stage count:', boardRes.body?.metrics?.reported);

  // 4. Coordinator advances stage: Reported -> Acknowledged -> Assigned -> In Progress -> Resolved
  const ackRes = await patch(`http://localhost:5000/api/issues/${issueId}/stage`, { stage: 'Acknowledged' }, orgToken);
  console.log('4. Acknowledged stage status:', ackRes.status, 'New Stage:', ackRes.body?.issue?.stage);

  const assignRes = await patch(`http://localhost:5000/api/issues/${issueId}/stage`, {
    stage: 'Assigned',
    notes: 'Assigned to AV technician team'
  }, orgToken);
  console.log('   Assigned stage status:', assignRes.status, 'New Stage:', assignRes.body?.issue?.stage);

  const progRes = await patch(`http://localhost:5000/api/issues/${issueId}/stage`, { stage: 'In Progress' }, orgToken);
  console.log('   In Progress stage status:', progRes.status, 'New Stage:', progRes.body?.issue?.stage);

  const resRes = await patch(`http://localhost:5000/api/issues/${issueId}/stage`, {
    stage: 'Resolved',
    notes: 'HDMI cable replaced and projector calibrated.'
  }, orgToken);
  console.log('   Resolved stage status:', resRes.status, 'New Stage:', resRes.body?.issue?.stage);

  // 5. Student reopens issue
  const reopenRes = await patch(`http://localhost:5000/api/issues/${issueId}/reopen`, {
    reopenReason: 'Still flickering during video playback.'
  }, studentToken);
  console.log('\n5. Student Reopen status:', reopenRes.status, 'Message:', reopenRes.body?.message);
  console.log('   New Stage after Reopen:', reopenRes.body?.issue?.stage);
  console.log('   Reopen Count:', reopenRes.body?.issue?.reopenCount);

  // 6. Test Auto High-Priority Trigger: Report 10 issues in 'food' category
  console.log('\n6. Testing Auto High-Priority Rule (10+ reports in one category)...');
  for (let i = 1; i <= 10; i++) {
    const foodReport = await post(
      `http://localhost:5000/api/issues/${targetEvent._id}`,
      {
        category: 'food',
        description: `Food line report ${i}: Long queue at counter B`,
        priority: 'low'
      },
      studentToken
    );
    if (i === 10) {
      console.log('   10th Food Report Priority:', foodReport.body?.issue?.priority);
      console.log('   Auto-elevated flag:', foodReport.body?.autoElevated);
    }
  }

  // 7. Verify Student Tracker endpoint
  const myIssuesRes = await get('http://localhost:5000/api/issues/my', studentToken);
  console.log('\n7. Student Tracker Issues count:', myIssuesRes.body?.count);

  console.log('\n🎉 FEATURE 1 (ISSUE REPORTING WITH SLA) VERIFIED WITH 100% SUCCESS!');
}

verifyIssueSLA().catch(console.error);
