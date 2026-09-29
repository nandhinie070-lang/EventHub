const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const { generateCertificatePDF } = require('../utils/pdfCertificate');

// Helper to generate unique certificate identifier
const generateCertId = () => {
  const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `CERT-${year}-${hash}`;
};

// @desc    Get certificates for logged-in user
// @route   GET /api/certificates/my-certificates
// @access  Private
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('event', 'title category department startDate endDate venueLocation')
      .sort({ createdAt: -1 });

    // Also find registrations where user attended but has not yet submitted feedback
    const attendedRegs = await Registration.find({
      user: req.user._id,
      checkedIn: true
    }).populate('event', 'title category department startDate endDate venueLocation');

    const pendingFeedbackEvents = [];
    for (const reg of attendedRegs) {
      if (!reg.event) continue;
      const hasFeedback = await Feedback.findOne({
        event: reg.event._id,
        user: req.user._id
      });
      const hasCert = certificates.some(
        (c) => c.event?._id?.toString() === reg.event._id?.toString()
      );

      if (!hasFeedback && !hasCert) {
        pendingFeedbackEvents.push({
          eventId: reg.event._id,
          eventTitle: reg.event.title,
          department: reg.event.department,
          ticketCode: reg.ticketCode
        });
      }
    }

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
      pendingFeedbackEvents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Self-claim / unlock certificate for logged in student
// @route   POST /api/certificates/claim/:eventId
// @access  Private
const claimCertificate = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // 1. Check registration & attendance
    const registration = await Registration.findOne({ event: eventId, user: userId });
    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this event.'
      });
    }

    if (!registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Attendance must be marked before certificate can be unlocked.'
      });
    }

    // 2. Check feedback submission
    const feedback = await Feedback.findOne({ event: eventId, user: userId });
    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must be submitted before certificate can be unlocked.'
      });
    }

    // 3. Find or issue certificate
    let cert = await Certificate.findOne({ user: userId, event: eventId });
    if (!cert) {
      const certificateId = generateCertId();
      const verificationHash = crypto
        .createHash('sha256')
        .update(`${certificateId}-${userId}-${eventId}-${Date.now()}`)
        .digest('hex')
        .slice(0, 16)
        .toUpperCase();

      cert = await Certificate.create({
        certificateId,
        user: userId,
        event: eventId,
        registration: registration._id,
        recipientName: req.user.name,
        eventTitle: event.title,
        verificationHash,
        issueDate: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate unlocked and ready for download!',
      certificate: cert
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate certificates in bulk for checked-in attendees who submitted feedback
// @route   POST /api/certificates/generate/:eventId
// @access  Private (Organizer, Admin)
const generateCertificates = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    // Role check
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'principal'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the event organizer or administration can issue certificates.'
      });
    }

    // Find all attended registrations
    const attendedRegistrations = await Registration.find({
      event: eventId,
      checkedIn: true
    }).populate('user', 'name email rollNo department');

    if (attendedRegistrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendees have been checked in for this event yet. Cannot issue certificates.'
      });
    }

    const createdCertificates = [];
    let pendingFeedbackCount = 0;

    for (const reg of attendedRegistrations) {
      // Must have feedback submitted
      const hasFeedback = await Feedback.findOne({
        event: eventId,
        user: reg.user._id
      });

      if (!hasFeedback) {
        pendingFeedbackCount++;
        continue;
      }

      // Check if certificate already exists
      let cert = await Certificate.findOne({
        user: reg.user._id,
        event: event._id
      });

      if (!cert) {
        const certificateId = generateCertId();
        const verificationHash = crypto
          .createHash('sha256')
          .update(`${certificateId}-${reg.user._id}-${event._id}-${Date.now()}`)
          .digest('hex')
          .slice(0, 16)
          .toUpperCase();

        cert = await Certificate.create({
          certificateId,
          user: reg.user._id,
          event: event._id,
          registration: reg._id,
          recipientName: reg.user.name,
          eventTitle: event.title,
          verificationHash,
          issueDate: new Date()
        });
      }

      createdCertificates.push(cert);
    }

    res.status(200).json({
      success: true,
      message: `Generated ${createdCertificates.length} certificates. (${pendingFeedbackCount} attendees awaiting feedback submission before unlocking).`,
      count: createdCertificates.length,
      pendingFeedbackCount,
      certificates: createdCertificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download official verifiable PDF certificate
// @route   GET /api/certificates/download/:certificateId
// @access  Public (verifiable)
const downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId
    }).populate('event', 'title department startDate endDate');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
    }

    const certData = {
      certificateId: certificate.certificateId,
      recipientName: certificate.recipientName,
      eventTitle: certificate.eventTitle,
      department: certificate.event?.department,
      issueDate: certificate.issueDate,
      verificationHash: certificate.verificationHash
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Certificate-${certificate.certificateId}.pdf"`
    );

    generateCertificatePDF(certData, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Public verification of a certificate
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId
    })
      .populate('event', 'title category department startDate endDate')
      .populate('user', 'name rollNo department collegeName');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid Certificate ID. Credential not found on official registry.'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Certificate successfully verified on official college registry.',
      certificate: {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipientName,
        eventTitle: certificate.eventTitle,
        department: certificate.event?.department,
        issueDate: certificate.issueDate,
        verificationHash: certificate.verificationHash
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyCertificates,
  claimCertificate,
  generateCertificates,
  downloadCertificate,
  verifyCertificate
};
