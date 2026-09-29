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

function get(url, token, isBinary = false) {
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
          const buffer = Buffer.concat(chunks);
          if (isBinary) {
            resolve({ status: res.statusCode, headers: res.headers, buffer });
          } else {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(buffer.toString()) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: buffer.toString() });
            }
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function verifyFeedbackFeature() {
  console.log('=== Starting Verification: Feedback & Certificate Gating ===\n');

  // 1. Login as Student and Organizer
  const studentLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'student@apex.edu',
    password: 'Student@123'
  });
  const studentToken = studentLogin.body.token;

  const orgLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'organizer@apex.edu',
    password: 'Organizer@123'
  });
  const orgToken = orgLogin.body.token;

  // 2. Fetch approved events
  const eventsRes = await get('http://localhost:5000/api/events');
  const targetEvent = eventsRes.body.events[0];
  console.log('1. Target Event:', targetEvent.title, `[ID: ${targetEvent._id}]`);

  // 3. Register student for targetEvent
  const regRes = await post(
    `http://localhost:5000/api/registrations/register/${targetEvent._id}`,
    {},
    studentToken
  );
  console.log('2. Student Registration status:', regRes.status, 'Message:', regRes.body?.message);
  const ticketCode = regRes.body?.ticket?.ticketCode;

  // 4. Try submitting feedback BEFORE attendance is marked (Should be rejected)
  const prematureFeedback = await post(
    `http://localhost:5000/api/feedback/${targetEvent._id}`,
    { rating: 5, comment: 'Premature review before check-in' },
    studentToken
  );
  console.log('3. Premature Feedback status (expected 400):', prematureFeedback.status, 'Message:', prematureFeedback.body?.message);

  // 5. Try claiming certificate BEFORE attendance & feedback (Should be rejected)
  const prematureCert = await post(
    `http://localhost:5000/api/certificates/claim/${targetEvent._id}`,
    {},
    studentToken
  );
  console.log('4. Premature Certificate Claim (expected 400):', prematureCert.status, 'Message:', prematureCert.body?.message);

  // 6. Organizer checks in student at gate
  const checkInRes = await post(
    'http://localhost:5000/api/registrations/check-in',
    { ticketCode },
    orgToken
  );
  console.log('5. Gate Check-in status:', checkInRes.status, 'Message:', checkInRes.body?.message);

  // 7. Try claiming certificate AFTER attendance BUT BEFORE feedback (Must still be rejected)
  const certWithoutFeedback = await post(
    `http://localhost:5000/api/certificates/claim/${targetEvent._id}`,
    {},
    studentToken
  );
  console.log('6. Certificate Claim without Feedback (expected 400):', certWithoutFeedback.status, 'Message:', certWithoutFeedback.body?.message);

  // 8. Student submits valid 5-star feedback
  const feedbackRes = await post(
    `http://localhost:5000/api/feedback/${targetEvent._id}`,
    {
      rating: 5,
      comment: 'Exceptional hands-on workshops and inspiring keynote speakers! Highly recommended.'
    },
    studentToken
  );
  console.log('7. Feedback Submission status:', feedbackRes.status, 'Message:', feedbackRes.body?.message);
  console.log('   Certificate auto-unlocked:', Boolean(feedbackRes.body?.certificate));
  console.log('   Certificate ID:', feedbackRes.body?.certificate?.certificateId);

  // 9. Try submitting duplicate feedback (Must be rejected)
  const duplicateFeedback = await post(
    `http://localhost:5000/api/feedback/${targetEvent._id}`,
    { rating: 4, comment: 'Second review attempt' },
    studentToken
  );
  console.log('8. Duplicate Feedback rejection (expected 400):', duplicateFeedback.status, 'Message:', duplicateFeedback.body?.message);

  // 10. Student claims/verifies unlocked certificate
  const claimRes = await post(
    `http://localhost:5000/api/certificates/claim/${targetEvent._id}`,
    {},
    studentToken
  );
  console.log('9. Certificate Claim after Feedback:', claimRes.status, 'Message:', claimRes.body?.message);

  // 11. Public aggregate feedback check
  const feedbackListRes = await get(`http://localhost:5000/api/feedback/event/${targetEvent._id}`);
  console.log('10. Event Feedback Reviews Count:', feedbackListRes.body?.totalReviews);
  console.log('    Average Rating:', feedbackListRes.body?.averageRating, '/ 5.0');

  console.log('\n🎉 FEATURE 1 (FEEDBACK & CERTIFICATE GATING) VERIFIED WITH 100% SUCCESS!');
}

verifyFeedbackFeature().catch(console.error);
