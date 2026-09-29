const PDFDocument = require('pdfkit');
const qrcode = require('qrcode');
const collegeConfig = require('../config/college');

/**
 * Generate an official On Duty (OD) Letter PDF
 * @param {Object} data
 * @param {http.ServerResponse} res
 */
const generateOdLetterPDF = async (data, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `OD Letter - ${data.rollNo} - ${data.eventTitle}`,
      Author: collegeConfig.name,
      Subject: 'Official On Duty Attendance Endorsement'
    }
  });

  doc.pipe(res);

  const collegeName = collegeConfig.name || 'Apex Institute of Technology';
  const collegeDomain = collegeConfig.domain || 'apex.edu';

  // 1. Decorative border
  doc
    .lineWidth(2)
    .strokeColor('#4338ca')
    .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .stroke();

  doc
    .lineWidth(0.5)
    .strokeColor('#cbd5e1')
    .rect(34, 34, doc.page.width - 68, doc.page.height - 68)
    .stroke();

  // 2. Letterhead Header
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#312e81')
    .text(collegeName.toUpperCase(), { align: 'center' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(`Autonomous Institution • Approved by AICTE • Affiliated to State Technological University`, {
      align: 'center'
    });

  doc
    .fontSize(8)
    .fillColor('#64748b')
    .text(`Campus Road, Tech District • Official Portal: https://${collegeDomain}`, {
      align: 'center'
    });

  doc.moveDown(0.5);

  // Horizontal divider
  doc
    .strokeColor('#4338ca')
    .lineWidth(1.5)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();

  doc.moveDown(0.8);

  // Reference and Date Row
  const startY = doc.y;
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(`Ref No: ${data.odRefNo}`, 50, startY);

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(`Date of Issue: ${data.issueDate}`, doc.page.width - 200, startY, {
      align: 'right'
    });

  doc.moveDown(1.5);

  // To Address
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('TO WHOMSOEVER IT MAY CONCERN / HEAD OF DEPARTMENT,');

  doc.moveDown(0.5);

  // Subject Header
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#4338ca')
    .text('SUBJECT: OFFICIAL ON DUTY (OD) ATTENDANCE REQUISITION & ENDORSEMENT', {
      underline: true
    });

  doc.moveDown(1);

  // Body Text
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#334155')
    .lineGap(4)
    .text(
      `This is to officially certify that the student detailed below has actively participated and represented our department/institution in the college event organized under formal campus approval:`,
      { align: 'justify' }
    );

  doc.moveDown(0.8);

  // Student & Event Particulars Box
  const boxTop = doc.y;
  doc
    .roundedRect(50, boxTop, doc.page.width - 100, 150, 8)
    .fillColor('#f8fafc')
    .fill()
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .stroke();

  doc.fillColor('#1e293b').fontSize(9).font('Helvetica');

  const leftCol = 70;
  const rightCol = 310;
  let rowY = boxTop + 15;

  const drawRow = (label, val, x) => {
    doc.font('Helvetica-Bold').fillColor('#64748b').text(label, x, rowY);
    doc.font('Helvetica').fillColor('#0f172a').text(val, x + 95, rowY);
  };

  drawRow('Student Name:', data.studentName, leftCol);
  drawRow('Roll / Reg No:', data.rollNo, rightCol);
  rowY += 22;

  drawRow('Department:', data.studentDepartment, leftCol);
  drawRow('Academic Year:', data.studentYear, rightCol);
  rowY += 22;

  drawRow('Event Title:', data.eventTitle, leftCol);
  drawRow('Category:', data.eventCategory, rightCol);
  rowY += 22;

  drawRow('Organized By:', data.eventDepartment, leftCol);
  drawRow('Venue / Mode:', data.venueLocation, rightCol);
  rowY += 22;

  drawRow('Schedule / Date:', data.eventSchedule, leftCol);
  drawRow('Gate Ticket Code:', data.ticketCode, rightCol);
  rowY += 22;

  drawRow('Attendance State:', 'VERIFIED (Gate Check-in Recorded)', leftCol);
  drawRow('Check-in Timestamp:', data.checkedInAt, rightCol);

  doc.y = boxTop + 165;
  doc.moveDown(0.8);

  // Endorsement Text
  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor('#334155')
    .lineGap(4)
    .text(
      `In view of verified physical attendance recorded via the institutional Gate Scanner, the student is hereby granted official ON DUTY (OD) attendance credit for the duration of this event. Course instructors and departmental attendance coordinators are requested to update academic registers accordingly.`,
      { align: 'justify' }
    );

  doc.moveDown(1.5);

  // Verification QR & Seal
  const qrTop = doc.y;
  const qrDataUrl = await qrcode.toDataURL(
    `https://${collegeDomain}/verify/od/${data.odRefNo}?roll=${data.rollNo}&event=${data.ticketCode}`,
    { width: 90, margin: 1 }
  );

  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  doc.image(qrBuffer, 60, qrTop, { width: 75, height: 75 });

  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#4338ca')
    .text('DIGITALLY SANCTIONED', 55, qrTop + 80);

  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text('Scan to verify OD presence', 55, qrTop + 90);

  // Official Signature Blocks
  const sigY = qrTop + 30;
  const sigCol1 = 200;
  const sigCol2 = 330;
  const sigCol3 = 450;

  doc.strokeColor('#cbd5e1').lineWidth(0.8);
  doc.moveTo(sigCol1, sigY).lineTo(sigCol1 + 90, sigY).stroke();
  doc.moveTo(sigCol2, sigY).lineTo(sigCol2 + 90, sigY).stroke();
  doc.moveTo(sigCol3, sigY).lineTo(sigCol3 + 90, sigY).stroke();

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b');
  doc.text('Faculty Lead', sigCol1, sigY + 5, { width: 90, align: 'center' });
  doc.text('Head of Dept', sigCol2, sigY + 5, { width: 90, align: 'center' });
  doc.text('Principal / Dean', sigCol3, sigY + 5, { width: 90, align: 'center' });

  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  doc.text('Event Coordination', sigCol1, sigY + 16, { width: 90, align: 'center' });
  doc.text(data.studentDepartment, sigCol2, sigY + 16, { width: 90, align: 'center' });
  doc.text(collegeName, sigCol3, sigY + 16, { width: 90, align: 'center' });

  // Footer Disclaimer
  doc
    .fontSize(7)
    .fillColor('#94a3b8')
    .text(
      `This is a computer-generated institutional document sanctioned by the Office of Academic Affairs. Tampering with this document constitutes academic misconduct. Ref: ${data.odRefNo}`,
      50,
      doc.page.height - 45,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.end();
};

module.exports = {
  generateOdLetterPDF
};
