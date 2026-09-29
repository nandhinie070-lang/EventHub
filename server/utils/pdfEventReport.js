const PDFDocument = require('pdfkit');
const qrcode = require('qrcode');
const collegeConfig = require('../config/college');

/**
 * Generate an official Post-Event Closure & Analytics Report PDF
 * @param {Object} data
 * @param {http.ServerResponse} res
 */
const generateEventReportPDF = async (data, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Event Report - ${data.event.title}`,
      Author: collegeConfig.name,
      Subject: 'Official Post-Event Executive Analytics & Audit Report'
    }
  });

  doc.pipe(res);

  const collegeName = collegeConfig.name || 'Apex Institute of Technology';
  const collegeDomain = collegeConfig.domain || 'apex.edu';

  // Helper for drawing section headers
  const drawSectionHeader = (title, y, iconChar = '■') => {
    doc
      .rect(40, y, 4, 18)
      .fillColor('#4338ca')
      .fill();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e1b4b')
      .text(title.toUpperCase(), 50, y + 3);

    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.8)
      .moveTo(40, y + 22)
      .lineTo(doc.page.width - 40, y + 22)
      .stroke();

    return y + 30;
  };

  // Helper for drawing metric boxes
  const drawKpiCard = (x, y, width, height, title, value, subtitle, accentColor) => {
    doc
      .roundedRect(x, y, width, height, 6)
      .fillColor('#f8fafc')
      .fill()
      .strokeColor('#e2e8f0')
      .lineWidth(0.8)
      .stroke();

    // Top color strip
    doc
      .rect(x, y, width, 3)
      .fillColor(accentColor)
      .fill();

    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#64748b')
      .text(title.toUpperCase(), x + 8, y + 8, { width: width - 16 });

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(value, x + 8, y + 22, { width: width - 16 });

    if (subtitle) {
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(subtitle, x + 8, y + 40, { width: width - 16 });
    }
  };

  // ================= PAGE 1 =================

  // 1. Institutional Letterhead Header
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#312e81')
    .text(collegeName.toUpperCase(), 40, 40, { align: 'center' });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(`Autonomous Institution • Approved by AICTE • Accreditations: NAAC 'A++' Grade`, {
      align: 'center'
    });

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#4338ca')
    .text('OFFICIAL POST-EVENT EXECUTIVE CLOSURE & ANALYTICS REPORT', {
      align: 'center'
    });

  doc.moveDown(0.5);

  // Divider
  doc
    .strokeColor('#4338ca')
    .lineWidth(1.5)
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .stroke();

  let curY = doc.y + 10;

  // Metadata Row (Ref No, Generated Date, Organizer)
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(`Report Ref: ${data.reportRefNo}`, 40, curY);

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Date of Audit: ${data.generatedAt}`, doc.page.width - 200, curY, {
      align: 'right'
    });

  curY += 20;

  // 2. Executive Summary KPI Grid (4 columns)
  const cardW = (doc.page.width - 80 - 24) / 4;
  const cardH = 55;

  drawKpiCard(
    40,
    curY,
    cardW,
    cardH,
    'Registrations',
    `${data.metrics.totalRegistrations}`,
    `Capacity: ${data.event.capacity}`,
    '#4338ca'
  );
  drawKpiCard(
    40 + cardW + 8,
    curY,
    cardW,
    cardH,
    'Attendance',
    `${data.metrics.totalAttended} (${data.metrics.attendanceRate})`,
    `${data.metrics.noShowCount} No-shows`,
    '#059669'
  );
  drawKpiCard(
    40 + (cardW + 8) * 2,
    curY,
    cardW,
    cardH,
    'Feedback Rating',
    `${data.metrics.averageRating} ★`,
    `${data.metrics.totalFeedbacks} Reviews`,
    '#d97706'
  );
  drawKpiCard(
    40 + (cardW + 8) * 3,
    curY,
    cardW,
    cardH,
    'Issue SLA Met',
    `${data.metrics.totalIssues - data.metrics.escalatedIssues}/${data.metrics.totalIssues}`,
    data.metrics.escalatedIssues > 0 ? `${data.metrics.escalatedIssues} Escalated` : '100% On-Time SLA',
    data.metrics.escalatedIssues > 0 ? '#dc2626' : '#2563eb'
  );

  curY += cardH + 20;

  // 3. Event Particulars & Logistics Section
  curY = drawSectionHeader('1. Event Specifications & Administrative Profile', curY);

  const specBoxW = doc.page.width - 80;
  doc
    .roundedRect(40, curY, specBoxW, 70, 6)
    .fillColor('#f8fafc')
    .fill()
    .strokeColor('#e2e8f0')
    .lineWidth(0.8)
    .stroke();

  doc.fontSize(8).font('Helvetica');
  const specCol1 = 55;
  const specCol2 = 320;
  let specRowY = curY + 10;

  const drawSpec = (lbl, val, x) => {
    doc.font('Helvetica-Bold').fillColor('#64748b').text(lbl, x, specRowY);
    doc.font('Helvetica').fillColor('#0f172a').text(val, x + 95, specRowY, { width: 160 });
  };

  drawSpec('Event Title:', data.event.title, specCol1);
  drawSpec('Department:', data.event.department, specCol2);
  specRowY += 18;

  drawSpec('Event Category:', (data.event.category || 'General').toUpperCase(), specCol1);
  drawSpec('Lead Organizer:', `${data.event.organizerName} (${data.event.organizerEmail})`, specCol2);
  specRowY += 18;

  drawSpec('Venue / Mode:', data.event.venue, specCol1);
  drawSpec('Execution Dates:', data.event.schedule, specCol2);

  curY += 85;

  // 4. Registration & Gate Attendance Breakdown
  curY = drawSectionHeader('2. Turnout & Gate Attendance Demographics', curY);

  // Table header
  const drawTableRow = (cols, y, isHeader = false) => {
    if (isHeader) {
      doc
        .rect(40, y, doc.page.width - 80, 16)
        .fillColor('#e0e7ff')
        .fill();
    } else {
      doc
        .rect(40, y, doc.page.width - 80, 16)
        .fillColor(y % 32 === 0 ? '#f8fafc' : '#ffffff')
        .fill();
    }

    doc
      .fontSize(7.5)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(isHeader ? '#312e81' : '#1e293b');

    let xPos = 50;
    cols.forEach((col) => {
      doc.text(col.text, xPos, y + 4, { width: col.width, align: col.align || 'left' });
      xPos += col.width + 10;
    });
  };

  const attCols = [
    { text: 'Demographic Segment', width: 170 },
    { text: 'Registrations', width: 90, align: 'center' },
    { text: 'Turnout (Attended)', width: 110, align: 'center' },
    { text: 'No-Shows / Absent', width: 90, align: 'center' }
  ];

  drawTableRow(attCols, curY, true);
  curY += 16;

  drawTableRow(
    [
      { text: 'Internal College Students', width: 170 },
      { text: `${data.metrics.internalRegistrations || data.metrics.internalAttendees}`, width: 90, align: 'center' },
      { text: `${data.metrics.internalAttendees}`, width: 110, align: 'center' },
      { text: `${(data.metrics.internalRegistrations || data.metrics.internalAttendees) - data.metrics.internalAttendees}`, width: 90, align: 'center' }
    ],
    curY
  );
  curY += 16;

  drawTableRow(
    [
      { text: 'External Visiting Attendees', width: 170 },
      { text: `${data.metrics.externalRegistrations || data.metrics.externalAttendees}`, width: 90, align: 'center' },
      { text: `${data.metrics.externalAttendees}`, width: 110, align: 'center' },
      { text: `${(data.metrics.externalRegistrations || data.metrics.externalAttendees) - data.metrics.externalAttendees}`, width: 90, align: 'center' }
    ],
    curY
  );
  curY += 16;

  drawTableRow(
    [
      { text: 'Consolidated Gross Attendance', width: 170 },
      { text: `${data.metrics.totalRegistrations}`, width: 90, align: 'center' },
      { text: `${data.metrics.totalAttended} (${data.metrics.attendanceRate})`, width: 110, align: 'center' },
      { text: `${data.metrics.noShowCount} (${data.metrics.noShowRate})`, width: 90, align: 'center' }
    ],
    curY,
    true
  );
  curY += 28;

  // 5. Food & Catering Coupon Utilization
  curY = drawSectionHeader('3. Food & Catering Coupon Consumption Audit', curY);

  const foodCols = [
    { text: 'Meal Token Category', width: 140 },
    { text: 'Issued Coupons', width: 95, align: 'center' },
    { text: 'Redeemed Count', width: 95, align: 'center' },
    { text: 'Unused / Saved', width: 85, align: 'center' },
    { text: 'Redemption Rate', width: 85, align: 'center' }
  ];

  drawTableRow(foodCols, curY, true);
  curY += 16;

  drawTableRow(
    [
      { text: 'Official Buffet Lunch', width: 140 },
      { text: `${data.metrics.lunchTotal}`, width: 95, align: 'center' },
      { text: `${data.metrics.lunchRedeemed}`, width: 95, align: 'center' },
      { text: `${data.metrics.lunchTotal - data.metrics.lunchRedeemed}`, width: 85, align: 'center' },
      { text: `${data.metrics.lunchRate}`, width: 85, align: 'center' }
    ],
    curY
  );
  curY += 16;

  drawTableRow(
    [
      { text: 'Evening Refreshment & Coffee', width: 140 },
      { text: `${data.metrics.refrTotal}`, width: 95, align: 'center' },
      { text: `${data.metrics.refrRedeemed}`, width: 95, align: 'center' },
      { text: `${data.metrics.refrTotal - data.metrics.refrRedeemed}`, width: 85, align: 'center' },
      { text: `${data.metrics.refrRate}`, width: 85, align: 'center' }
    ],
    curY
  );
  curY += 16;

  drawTableRow(
    [
      { text: 'Total Catering Operations', width: 140 },
      { text: `${data.metrics.lunchTotal + data.metrics.refrTotal}`, width: 95, align: 'center' },
      { text: `${data.metrics.lunchRedeemed + data.metrics.refrRedeemed}`, width: 95, align: 'center' },
      { text: `${(data.metrics.lunchTotal + data.metrics.refrTotal) - (data.metrics.lunchRedeemed + data.metrics.refrRedeemed)}`, width: 85, align: 'center' },
      { text: `${data.metrics.totalAttended > 0 ? (((data.metrics.lunchRedeemed + data.metrics.refrRedeemed) / (data.metrics.lunchTotal + data.metrics.refrTotal || 1)) * 100).toFixed(1) : 0}%`, width: 85, align: 'center' }
    ],
    curY,
    true
  );

  // Footer for Page 1
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      `EventHub Institutional Governance • Page 1 of 2 • Ref: ${data.reportRefNo}`,
      40,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 80 }
    );

  // ================= PAGE 2 =================
  doc.addPage({ size: 'A4', margin: 40 });
  curY = 40;

  // Header on Page 2
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#4338ca')
    .text(`${data.event.title.toUpperCase()} — CLOSURE REPORT CONTINUATION`, 40, curY);

  doc
    .strokeColor('#cbd5e1')
    .lineWidth(0.8)
    .moveTo(40, curY + 14)
    .lineTo(doc.page.width - 40, curY + 14)
    .stroke();

  curY += 25;

  // 6. Feedback & Attendee Satisfaction Analytics
  curY = drawSectionHeader('4. Attendee Satisfaction & Star Feedback Metrics', curY);

  // Feedback summary cards
  const fbBoxW = (doc.page.width - 80 - 16) / 2;
  doc
    .roundedRect(40, curY, fbBoxW, 75, 6)
    .fillColor('#f8fafc')
    .fill()
    .strokeColor('#e2e8f0')
    .lineWidth(0.8)
    .stroke();

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('OVERALL EXPERIENCE RATING', 50, curY + 10);

  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#d97706')
    .text(`${data.metrics.averageRating} / 5.0`, 50, curY + 25);

  const starCount = Math.round(parseFloat(data.metrics.averageRating) || 5);
  const starsStr = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
  doc
    .fontSize(11)
    .font('Helvetica')
    .fillColor('#f59e0b')
    .text(starsStr, 50, curY + 52);

  doc
    .fontSize(7.5)
    .fillColor('#64748b')
    .text(`Based on ${data.metrics.totalFeedbacks} verified participant submissions`, 110, curY + 54);

  // Star breakdown column
  const distBoxX = 40 + fbBoxW + 16;
  doc
    .roundedRect(distBoxX, curY, fbBoxW, 75, 6)
    .fillColor('#f8fafc')
    .fill()
    .strokeColor('#e2e8f0')
    .lineWidth(0.8)
    .stroke();

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('STAR DISTRIBUTION BREAKDOWN', distBoxX + 10, curY + 10);

  let distRowY = curY + 24;
  [5, 4, 3, 2, 1].forEach((stars) => {
    const count = data.metrics.ratingCounts[stars] || 0;
    const pct = data.metrics.totalFeedbacks > 0 ? Math.round((count / data.metrics.totalFeedbacks) * 100) : 0;
    doc
      .fontSize(7)
      .font('Helvetica-Bold')
      .fillColor('#334155')
      .text(`${stars} Star:`, distBoxX + 10, distRowY);

    // Progress bar
    doc
      .rect(distBoxX + 55, distRowY + 1, 90, 5)
      .fillColor('#e2e8f0')
      .fill();

    if (pct > 0) {
      doc
        .rect(distBoxX + 55, distRowY + 1, (90 * pct) / 100, 5)
        .fillColor('#f59e0b')
        .fill();
    }

    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`${count} (${pct}%)`, distBoxX + 155, distRowY);

    distRowY += 9;
  });

  curY += 88;

  // Recent Comments
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text('Select Participant Feedback & Testimonials:', 40, curY);
  curY += 12;

  if (data.metrics.recentFeedbacks && data.metrics.recentFeedbacks.length > 0) {
    data.metrics.recentFeedbacks.slice(0, 2).forEach((fb) => {
      doc
        .roundedRect(40, curY, doc.page.width - 80, 24, 4)
        .fillColor('#ffffff')
        .fill()
        .strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor('#4338ca')
        .text(`${fb.userName || 'Attendee'} (${'★'.repeat(fb.rating || 5)}):`, 48, curY + 7);

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`"${fb.comment}"`, 160, curY + 7, { width: doc.page.width - 250, ellipsis: true });

      curY += 28;
    });
  } else {
    doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#94a3b8').text('No written feedback comments submitted yet.', 40, curY);
    curY += 18;
  }

  curY += 8;

  // 7. Issue Tracking & SLA Resolution Compliance
  curY = drawSectionHeader('5. Ground Issue Management & SLA Resolution Performance', curY);

  const issueCols = [
    { text: 'Incident Category', width: 140 },
    { text: 'Total Logged', width: 95, align: 'center' },
    { text: 'Resolved & Confirmed', width: 110, align: 'center' },
    { text: 'Under Resolution', width: 95, align: 'center' },
    { text: 'SLA Escalations', width: 80, align: 'center' }
  ];

  drawTableRow(issueCols, curY, true);
  curY += 16;

  const cats = [
    { key: 'food', label: 'Food & Refreshments' },
    { key: 'seating', label: 'Seating & Hall Capacity' },
    { key: 'audio-visual', label: 'Audio-Visual / Projectors' },
    { key: 'venue', label: 'Venue Infrastructure' },
    { key: 'cleanliness', label: 'Cleanliness & Restrooms' },
    { key: 'other', label: 'Miscellaneous / Other' }
  ];

  cats.forEach((c) => {
    const logged = data.metrics.categoryCounts[c.key] || 0;
    const resolved = data.metrics.categoryResolvedCounts?.[c.key] || (logged > 0 ? logged : 0);
    const active = logged - resolved;
    const escalated = data.metrics.categoryEscalatedCounts?.[c.key] || 0;

    drawTableRow(
      [
        { text: c.label, width: 140 },
        { text: `${logged}`, width: 95, align: 'center' },
        { text: `${resolved}`, width: 110, align: 'center' },
        { text: `${active}`, width: 95, align: 'center' },
        { text: `${escalated}`, width: 80, align: 'center' }
      ],
      curY
    );
    curY += 15;
  });

  // Consolidated issue row
  drawTableRow(
    [
      { text: 'Gross Incident Summary', width: 140 },
      { text: `${data.metrics.totalIssues}`, width: 95, align: 'center' },
      { text: `${data.metrics.resolvedIssues}`, width: 110, align: 'center' },
      { text: `${data.metrics.inProgressIssues}`, width: 95, align: 'center' },
      { text: `${data.metrics.escalatedIssues}`, width: 80, align: 'center' }
    ],
    curY,
    true
  );

  curY += 28;

  // 8. Official Endorsement, Signatures & Digital Seal
  const sigY = curY;
  const qrTop = sigY;
  const qrDataUrl = await qrcode.toDataURL(
    `https://${collegeDomain}/verify/event-report/${data.reportRefNo}?id=${data.event.id}`,
    { width: 80, margin: 1 }
  );
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  doc.image(qrBuffer, 45, qrTop, { width: 65, height: 65 });

  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#4338ca')
    .text('DIGITAL AUDIT SEAL', 40, qrTop + 68, { width: 75, align: 'center' });

  // Signature lines
  const sig1X = 145;
  const sig2X = 275;
  const sig3X = 405;
  const sigLineY = sigY + 45;

  doc.strokeColor('#cbd5e1').lineWidth(0.8);
  doc.moveTo(sig1X, sigLineY).lineTo(sig1X + 105, sigLineY).stroke();
  doc.moveTo(sig2X, sigLineY).lineTo(sig2X + 105, sigLineY).stroke();
  doc.moveTo(sig3X, sigLineY).lineTo(sig3X + 105, sigLineY).stroke();

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1e293b');
  doc.text(data.event.organizerName || 'Event Coordinator', sig1X, sigLineY + 5, { width: 105, align: 'center' });
  doc.text('Head of Department', sig2X, sigLineY + 5, { width: 105, align: 'center' });
  doc.text('Dean / Principal', sig3X, sigLineY + 5, { width: 105, align: 'center' });

  doc.fontSize(6.5).font('Helvetica').fillColor('#64748b');
  doc.text('Primary Organizer', sig1X, sigLineY + 16, { width: 105, align: 'center' });
  doc.text(data.event.department || 'Department Lead', sig2X, sigLineY + 16, { width: 105, align: 'center' });
  doc.text(collegeName, sig3X, sigLineY + 16, { width: 105, align: 'center' });

  // Final Footer
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      `EventHub Institutional Governance • Page 2 of 2 • Verified Final Post-Event Executive Audit • Ref: ${data.reportRefNo}`,
      40,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 80 }
    );

  doc.end();
};

module.exports = {
  generateEventReportPDF
};
