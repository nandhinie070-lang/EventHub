const nodemailer = require('nodemailer');
const collegeConfig = require('../config/college');

// Initialize transporter if SMTP variables are present
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

const sendOtpEmail = async (email, otp, name = 'Student') => {
  const transporter = createTransporter();

  const subject = `Your Verification Code - ${collegeConfig.shortName || 'EventHub'}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 700;">EventHub</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">${collegeConfig.name}</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${name}</strong>,</p>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">Use the following One-Time Password (OTP) to complete your verification:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338ca; padding: 12px 24px; background: #e0e7ff; border-radius: 10px; display: inline-block;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you did not request this email, please ignore it.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`\n==================================================`);
    console.log(`📨 [SMTP MISSING] Verification OTP for ${email}: [ ${otp} ]`);
    console.log(`==================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${collegeConfig.shortName || 'EventHub'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      html
    });
    console.log(`✅ OTP email sent to ${email} (Message ID: ${info.messageId})`);
    return { success: true, simulated: false };
  } catch (error) {
    console.warn(`⚠️ Failed to send OTP email via SMTP: ${error.message}`);
    console.log(`\n==================================================`);
    console.log(`📨 [FALLBACK OTP] Code for ${email}: [ ${otp} ]`);
    console.log(`==================================================\n`);
    return { success: true, simulated: true, error: error.message };
  }
};

module.exports = {
  sendOtpEmail
};
