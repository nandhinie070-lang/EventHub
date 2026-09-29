const PDFDocument = require('pdfkit');
const collegeConfig = require('../config/college');

/**
 * Generate a verifiable PDF certificate stream
 * @param {Object} certificateData
 * @param {Object} res Express response object
 */
const generateCertificatePDF = (certificateData, res) => {
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margins: { top: 30, bottom: 30, left: 30, right: 30 }
  });

  // Pipe to response
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // 1. Background fill
  doc.rect(0, 0, pageWidth, pageHeight).fill('#fafafa');

  // 2. Decorative Outer Border (Navy/Indigo)
  doc
    .rect(20, 20, pageWidth - 40, pageHeight - 40)
    .lineWidth(4)
    .stroke('#312e81');

  // 3. Decorative Inner Border (Gold)
  doc
    .rect(28, 28, pageWidth - 56, pageHeight - 56)
    .lineWidth(1.5)
    .stroke('#d97706');

  // Corner Accents
  const cornerSize = 16;
  const drawCorner = (x, y) => {
    doc.rect(x, y, cornerSize, cornerSize).fill('#4f46e5');
  };
  drawCorner(22, 22);
  drawCorner(pageWidth - 38, 22);
  drawCorner(22, pageHeight - 38);
  drawCorner(pageWidth - 38, pageHeight - 38);

  // 4. College Header
  doc
    .fillColor('#312e81')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(collegeConfig.name.toUpperCase(), 0, 60, {
      align: 'center',
      characterSpacing: 1.5
    });

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text(
      'An Autonomous Institution Approved by AICTE • Accredited with "A++" Grade',
      0,
      88,
      { align: 'center' }
    );

  // Divider Line
  doc
    .moveTo(pageWidth / 2 - 160, 108)
    .lineTo(pageWidth / 2 + 160, 108)
    .lineWidth(1.5)
    .stroke('#d97706');

  // 5. Certificate Title
  doc
    .fillColor('#4338ca')
    .fontSize(26)
    .font('Helvetica-Bold')
    .text('CERTIFICATE OF PARTICIPATION', 0, 126, {
      align: 'center',
      characterSpacing: 2
    });

  // 6. Presentation text
  doc
    .fillColor('#64748b')
    .fontSize(12)
    .font('Helvetica-Oblique')
    .text('This is proudly presented to certify that', 0, 172, {
      align: 'center'
    });

  // 7. Recipient Name
  doc
    .fillColor('#1e1b4b')
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(certificateData.recipientName, 0, 196, {
      align: 'center'
    });

  // Underline beneath name
  const nameWidth = doc.widthOfString(certificateData.recipientName);
  doc
    .moveTo(pageWidth / 2 - Math.max(nameWidth / 2 + 20, 120), 232)
    .lineTo(pageWidth / 2 + Math.max(nameWidth / 2 + 20, 120), 232)
    .lineWidth(1)
    .stroke('#cbd5e1');

  // 8. Event Recognition Statement
  const eventDate = new Date(certificateData.issueDate).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
  );

  doc
    .fillColor('#334155')
    .fontSize(12)
    .font('Helvetica')
    .text(
      `has actively participated and successfully completed the campus event`,
      0,
      252,
      { align: 'center' }
    );

  doc
    .fillColor('#4f46e5')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(`"${certificateData.eventTitle}"`, 0, 276, {
      align: 'center'
    });

  doc
    .fillColor('#475569')
    .fontSize(11)
    .font('Helvetica')
    .text(
      `organized by the Department of ${certificateData.department || 'Academic Affairs'} on ${eventDate}.`,
      0,
      306,
      { align: 'center' }
    );

  // 9. Signatures Area
  const sigY = 410;

  // HOD Signature Block
  doc
    .moveTo(120, sigY)
    .lineTo(280, sigY)
    .lineWidth(1)
    .stroke('#94a3b8');

  doc
    .fillColor('#1e293b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Dr. Sarah Jenkins', 120, sigY + 8, {
      width: 160,
      align: 'center'
    });
  doc
    .fillColor('#64748b')
    .fontSize(9)
    .font('Helvetica')
    .text('Head of Department', 120, sigY + 22, {
      width: 160,
      align: 'center'
    });

  // Official Seal Emblem in Center
  doc
    .circle(pageWidth / 2, sigY + 6, 28)
    .lineWidth(1.5)
    .stroke('#d97706');
  doc
    .fillColor('#d97706')
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('OFFICIAL SEAL', pageWidth / 2 - 30, sigY - 2, {
      width: 60,
      align: 'center'
    });
  doc
    .fontSize(6)
    .text('VERIFIED CREDENTIAL', pageWidth / 2 - 35, sigY + 8, {
      width: 70,
      align: 'center'
    });

  // Principal Signature Block
  doc
    .moveTo(pageWidth - 280, sigY)
    .lineTo(pageWidth - 120, sigY)
    .lineWidth(1)
    .stroke('#94a3b8');

  doc
    .fillColor('#1e293b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Dr. Robert Vance', pageWidth - 280, sigY + 8, {
      width: 160,
      align: 'center'
    });
  doc
    .fillColor('#64748b')
    .fontSize(9)
    .font('Helvetica')
    .text('Principal & Director', pageWidth - 280, sigY + 22, {
      width: 160,
      align: 'center'
    });

  // 10. Security & Verification Footer
  const footerY = pageHeight - 52;
  doc
    .fillColor('#94a3b8')
    .fontSize(8)
    .font('Helvetica')
    .text(
      `Certificate ID: ${certificateData.certificateId}  •  Verification Hash: ${certificateData.verificationHash}  •  Issued by EventHub Platform`,
      0,
      footerY,
      { align: 'center' }
    );

  doc.end();
};

module.exports = {
  generateCertificatePDF
};
