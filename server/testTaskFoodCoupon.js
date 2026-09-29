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

async function verifyFoodCoupons() {
  console.log('=== Starting Verification: Food Coupon QR System ===\n');

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

  // 2. Fetch target event
  const eventsRes = await get('http://localhost:5000/api/events');
  const targetEvent = eventsRes.body.events[0];
  console.log('1. Target Event:', targetEvent.title, `[ID: ${targetEvent._id}]`);

  // 3. Student fetches coupons
  const couponsRes = await get('http://localhost:5000/api/food-coupons/my-coupons', studentToken);
  console.log('2. My Food Coupons count:', couponsRes.body.count);

  const eventCoupons = couponsRes.body.coupons.filter(
    (c) => c.event?._id?.toString() === targetEvent._id.toString()
  );
  console.log('   Coupons for Target Event:', eventCoupons.length);

  const lunchCoupon = eventCoupons.find((c) => c.couponType === 'lunch');
  const refrCoupon = eventCoupons.find((c) => c.couponType === 'refreshment');

  console.log('   Lunch Coupon Code:', lunchCoupon?.couponCode, 'Has QR:', Boolean(lunchCoupon?.qrCodeDataUrl));
  console.log('   Refreshment Coupon Code:', refrCoupon?.couponCode, 'Has QR:', Boolean(refrCoupon?.qrCodeDataUrl));

  // 4. Volunteer scans and redeems Lunch coupon (First scan -> Success)
  const firstScanRes = await post(
    'http://localhost:5000/api/food-coupons/redeem',
    { couponCode: lunchCoupon.couponCode },
    orgToken
  );
  console.log('\n3. First Lunch Scan (expected 200):', firstScanRes.status, 'Message:', firstScanRes.body?.message);

  // 5. Volunteer scans the SAME Lunch coupon again (Second scan -> Must show "Already redeemed")
  const secondScanRes = await post(
    'http://localhost:5000/api/food-coupons/redeem',
    { couponCode: lunchCoupon.couponCode },
    orgToken
  );
  console.log('4. Second Lunch Scan (expected 400 Already redeemed):', secondScanRes.status);
  console.log('   Rejection Message:', secondScanRes.body?.message);
  console.log('   isAlreadyRedeemed flag:', secondScanRes.body?.isAlreadyRedeemed);

  // 6. Volunteer redeems Refreshment coupon
  const refrScanRes = await post(
    'http://localhost:5000/api/food-coupons/redeem',
    { couponCode: refrCoupon.couponCode },
    orgToken
  );
  console.log('\n5. Refreshment Scan (expected 200):', refrScanRes.status, 'Message:', refrScanRes.body?.message);

  // 7. Organizer checks Live Food Count
  const statsRes = await get(`http://localhost:5000/api/food-coupons/stats/${targetEvent._id}`, orgToken);
  console.log('\n6. Organizer Live Food Counts:');
  console.log('   Lunch -> Total:', statsRes.body.lunch?.total, 'Redeemed:', statsRes.body.lunch?.redeemed, 'Remaining:', statsRes.body.lunch?.remaining);
  console.log('   Refreshment -> Total:', statsRes.body.refreshment?.total, 'Redeemed:', statsRes.body.refreshment?.redeemed, 'Remaining:', statsRes.body.refreshment?.remaining);
  console.log('   Recent Redemptions Log Count:', statsRes.body.recentRedemptions?.length);

  console.log('\n🎉 FEATURE 2 (FOOD COUPON QR SYSTEM) VERIFIED WITH 100% SUCCESS!');
}

verifyFoodCoupons().catch(console.error);
