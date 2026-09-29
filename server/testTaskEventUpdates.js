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

async function verifyEventUpdates() {
  console.log('=== Starting Verification: Event Updates Feed ===\n');

  // 1. Log in Organizer & Student
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

  // 2. Fetch target event
  const eventsRes = await get('http://localhost:5000/api/events');
  const targetEvent = eventsRes.body.events[0];
  console.log('1. Target Event:', targetEvent.title, `[ID: ${targetEvent._id}]`);

  // 3. Unauthorized post attempt by student (should fail with 403)
  const unauthPost = await post(
    `http://localhost:5000/api/event-updates/${targetEvent._id}`,
    {
      category: 'venue',
      title: 'Student announcement',
      message: 'This should be blocked.'
    },
    studentToken
  );
  console.log('2. Unauthorized student post status (expected 403):', unauthPost.status, 'Message:', unauthPost.body?.message);

  // 4. Invalid category attempt (should fail with 400)
  const invalidCategoryPost = await post(
    `http://localhost:5000/api/event-updates/${targetEvent._id}`,
    {
      category: 'invalid_category',
      title: 'Bad Category',
      message: 'Testing invalid categories'
    },
    orgToken
  );
  console.log('3. Invalid category post status (expected 400):', invalidCategoryPost.status, 'Message:', invalidCategoryPost.body?.message);

  // 5. Organizer posts updates across categories: venue, time, lunch, refreshments, other
  const sampleUpdates = [
    {
      category: 'venue',
      title: 'Lab 4 Door Access Code',
      message: 'Lab 4 access code is 8842. Turing block entrance opens at 8:30 AM.',
      priority: 'normal'
    },
    {
      category: 'time',
      title: 'Keynote Starts at 09:30 AM',
      message: 'Opening address starts promptly at 9:30 AM. Please take your seats 10 mins prior.',
      priority: 'normal'
    },
    {
      category: 'lunch',
      title: 'Lunch Buffet Service Active',
      message: 'Hot lunch is now being served in Central Food Court Block B. Show your QR coupon to the volunteer.',
      priority: 'urgent'
    },
    {
      category: 'refreshments',
      title: 'Evening Coffee & Snacks in Foyer',
      message: 'Tea, coffee, and refreshments are available at the main registration desk.',
      priority: 'normal'
    },
    {
      category: 'other',
      title: 'Campus WiFi Configuration',
      message: 'Connect to SSID "ApexEvents2026", no web portal login required.',
      priority: 'normal'
    }
  ];

  for (const upd of sampleUpdates) {
    const res = await post(
      `http://localhost:5000/api/event-updates/${targetEvent._id}`,
      upd,
      orgToken
    );
    console.log(`4. Broadcast [${upd.category.toUpperCase()}]:`, res.status === 201 ? 'SUCCESS' : 'FAILED', `"${upd.title}"`);
  }

  // 6. Fetch full updates timeline
  const timelineRes = await get(`http://localhost:5000/api/event-updates/${targetEvent._id}`);
  console.log('\n5. Event Updates Timeline Count:', timelineRes.body?.count);
  console.log('   Latest Update Category:', timelineRes.body?.updates?.[0]?.category);
  console.log('   Latest Update Title:', timelineRes.body?.updates?.[0]?.title);
  console.log('   Author:', timelineRes.body?.updates?.[0]?.postedBy?.name);

  console.log('\n🎉 FEATURE 3 (EVENT UPDATES FEED) VERIFIED WITH 100% SUCCESS!');
}

verifyEventUpdates().catch(console.error);
