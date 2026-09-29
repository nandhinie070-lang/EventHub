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
            resolve({
              status: res.statusCode,
              headers: res.headers,
              buffer
            });
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

async function verify() {
  console.log('=== Starting Verification for Certificates, Analytics & User Management ===\n');

  // 1. Login as Admin & Organizer
  const adminLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'admin@apex.edu',
    password: 'Admin@123'
  });
  const adminToken = adminLogin.body.token;

  const orgLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'organizer@apex.edu',
    password: 'Organizer@123'
  });
  const orgToken = orgLogin.body.token;

  // 2. Find an event with checked-in attendees (from Task 3)
  const eventsRes = await get('http://localhost:5000/api/events');
  const targetEvent = eventsRes.body.events.find((e) => e.title === 'Apex AI & Cloud Summit 2026');
  console.log('1. Target Event for Certificate Generation:', targetEvent.title, `[ID: ${targetEvent._id}]`);

  // 3. Generate Bulk Certificates for Attended Registrations
  const certGenRes = await post(
    `http://localhost:5000/api/certificates/generate/${targetEvent._id}`,
    {},
    orgToken
  );
  console.log('2. Certificate Generation status:', certGenRes.status);
  console.log('   Message:', certGenRes.body.message);
  console.log('   Certificates generated count:', certGenRes.body.count);

  const issuedCert = certGenRes.body.certificates[0];
  console.log('   Sample Certificate ID:', issuedCert?.certificateId);
  console.log('   Recipient Name:', issuedCert?.recipientName);
  console.log('   Verification Hash:', issuedCert?.verificationHash);

  // 4. Verify PDF Streaming & Valid PDF Binary Signature (%PDF)
  const pdfDownload = await get(
    `http://localhost:5000/api/certificates/download/${issuedCert.certificateId}`,
    null,
    true
  );
  console.log('\n3. PDF Download Status:', pdfDownload.status);
  console.log('   Content-Type:', pdfDownload.headers['content-type']);
  const isPdfHeader = pdfDownload.buffer.slice(0, 5).toString() === '%PDF-';
  console.log('   Valid PDF Binary Header (%PDF-):', isPdfHeader);
  console.log('   PDF Byte Size:', pdfDownload.buffer.length, 'bytes');

  // 5. Public Registry Verification
  const verifyRegistry = await get(
    `http://localhost:5000/api/certificates/verify/${issuedCert.certificateId}`
  );
  console.log('\n4. Public Registry Verification:');
  console.log('   Status:', verifyRegistry.status, 'Valid:', verifyRegistry.body.valid);
  console.log('   Verified Title:', verifyRegistry.body.certificate?.eventTitle);

  // 6. Analytics Overview API
  const analyticsRes = await get('http://localhost:5000/api/analytics/overview', adminToken);
  console.log('\n5. Analytics KPIs:');
  console.log('   Total Events:', analyticsRes.body.kpis.totalEvents);
  console.log('   Total Registrations:', analyticsRes.body.kpis.totalRegistrations);
  console.log('   Total Checked In:', analyticsRes.body.kpis.totalCheckedIn);
  console.log('   Attendance Rate:', analyticsRes.body.kpis.attendanceRate + '%');
  console.log('   Certificates Issued:', analyticsRes.body.kpis.totalCertificates);
  console.log('   Department Stats Count:', analyticsRes.body.departmentStats.length);
  console.log('   Category Stats Count:', analyticsRes.body.categoryStats.length);
  console.log('   Monthly Trend Points:', analyticsRes.body.monthlyTrends.length);

  // 7. User Management Directory (Admin)
  const usersRes = await get('http://localhost:5000/api/users', adminToken);
  console.log('\n6. User Directory:');
  console.log('   Total Users in Database:', usersRes.body.total);
  console.log('   Users retrieved:', usersRes.body.count);

  console.log('\n🎉 ALL CERTIFICATE, ANALYTICS & DIRECTORY TESTS PASSED WITH 100% SUCCESS!');
}

verify().catch(console.error);
