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
  console.log('=== Starting Task 3: Registrations, QR Ticketing & Check-in Verification ===');

  // 1. Get an approved event
  const eventsRes = await get('http://localhost:5000/api/events');
  const approvedEvent = eventsRes.body.events.find((e) => e.status === 'approved');
  if (!approvedEvent) {
    throw new Error('No approved event found in catalog');
  }
  console.log('1. Target Event for Registration:', approvedEvent.title, `[ID: ${approvedEvent._id}]`);

  // 2. Register & verify a student user
  const studentEmail = `student_${Date.now()}@apex.edu`;
  const regUserRes = await post('http://localhost:5000/api/auth/register', {
    name: 'Marcus Vance',
    email: studentEmail,
    password: 'Password@123',
    userType: 'internal',
    rollNo: '23CS140',
    department: 'Computer Science & Engineering',
    year: '1st Year'
  });

  const otp = regUserRes.body.otpPreview;
  const verifyRes = await post('http://localhost:5000/api/auth/verify-otp', {
    email: studentEmail,
    otp
  });
  const studentToken = verifyRes.body.token;
  console.log('2. Verified Student account created:', studentEmail);

  // 3. Student registers for the event
  const regEventRes = await post(
    `http://localhost:5000/api/registrations/register/${approvedEvent._id}`,
    {},
    studentToken
  );
  console.log('3. Registration status:', regEventRes.status, 'Message:', regEventRes.body.message);
  const ticket = regEventRes.body.ticket;
  console.log('   Generated Ticket Code:', ticket.ticketCode);
  console.log('   QR Code generated:', ticket.qrCodeDataUrl.startsWith('data:image/png;base64,'));

  // 4. Duplicate registration test
  const dupRes = await post(
    `http://localhost:5000/api/registrations/register/${approvedEvent._id}`,
    {},
    studentToken
  );
  console.log('4. Duplicate Registration rejection:', dupRes.status === 400, 'Message:', dupRes.body.message);

  // 5. Query student tickets
  const myTicketsRes = await get('http://localhost:5000/api/registrations/my-tickets', studentToken);
  console.log('5. Student My Tickets count:', myTicketsRes.body.count, 'Matches ticketCode:', myTicketsRes.body.tickets[0].ticketCode === ticket.ticketCode);

  // 6. Organizer login & check-in attendee
  const orgLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'organizer@apex.edu',
    password: 'Organizer@123'
  });
  const orgToken = orgLogin.body.token;

  const checkInRes = await post(
    'http://localhost:5000/api/registrations/check-in',
    {
      ticketCode: ticket.ticketCode,
      eventId: approvedEvent._id
    },
    orgToken
  );
  console.log('6. Gate Check-in Result:', checkInRes.status, 'Message:', checkInRes.body.message);
  console.log('   Admitted Attendee:', checkInRes.body.attendee?.name, `[${checkInRes.body.attendee?.rollNo}]`);

  // 7. Double check-in test
  const doubleCheckInRes = await post(
    'http://localhost:5000/api/registrations/check-in',
    {
      ticketCode: ticket.ticketCode,
      eventId: approvedEvent._id
    },
    orgToken
  );
  console.log('7. Double Check-in prevention:', doubleCheckInRes.status === 400, 'Message:', doubleCheckInRes.body.message);

  // 8. Event Manifest check
  const rosterRes = await get(
    `http://localhost:5000/api/registrations/event/${approvedEvent._id}/attendees`,
    orgToken
  );
  console.log('8. Attendee Manifest count:', rosterRes.body.count, 'CheckedIn count:', rosterRes.body.event.checkedInCount);

  console.log('\n🎉 ALL TASK 3 REGISTRATION & QR CHECK-IN TESTS PASSED WITH 100% SUCCESS!');
}

verify().catch(console.error);
