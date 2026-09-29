const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Certificate = require('../models/Certificate');
const crypto = require('crypto');

const generateCertId = () => {
  const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `CERT-${year}-${hash}`;
};

// @desc    Submit event feedback (star rating + comment)
// @route   POST /api/feedback/:eventId
// @access  Private (student / attendee)
const submitFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid star rating between 1 and 5 is required.'
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide feedback comments.'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    // 1. Verify user was registered for the event
    const registration = await Registration.findOne({
      event: eventId,
      user: userId
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to submit feedback.'
      });
    }

    // 2. Attendance must be marked before feedback can be given
    if (!registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Attendance must be marked before you can submit feedback and unlock your certificate.'
      });
    }

    // 3. One feedback per user per event
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this event.'
      });
    }

    const feedback = await Feedback.create({
      event: eventId,
      user: userId,
      registration: registration._id,
      rating: Number(rating),
      comment: comment.trim()
    });

    // 4. Automatically issue/unlock certificate since attendance is marked AND feedback is now submitted!
    let certificate = await Certificate.findOne({
      user: userId,
      event: eventId
    });

    if (!certificate) {
      const certificateId = generateCertId();
      const verificationHash = crypto
        .createHash('sha256')
        .update(`${certificateId}-${userId}-${eventId}-${Date.now()}`)
        .digest('hex')
        .slice(0, 16)
        .toUpperCase();

      certificate = await Certificate.create({
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

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! Your official E-Certificate has been unlocked.',
      feedback,
      certificate
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this event.'
      });
    }
    next(error);
  }
};

// @desc    Get user's feedback for a specific event
// @route   GET /api/feedback/my/:eventId
// @access  Private
const getMyEventFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const feedback = await Feedback.findOne({
      event: eventId,
      user: userId
    });

    // Check attendance status
    const registration = await Registration.findOne({
      event: eventId,
      user: userId
    });

    const isAttended = Boolean(registration?.checkedIn);
    const hasFeedback = Boolean(feedback);
    const certificateUnlocked = isAttended && hasFeedback;

    res.status(200).json({
      success: true,
      hasSubmitted: hasFeedback,
      isAttended,
      certificateUnlocked,
      feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public/organizer aggregate feedback for an event
// @route   GET /api/feedback/event/:eventId
// @access  Public
const getEventFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const feedbacks = await Feedback.find({ event: eventId })
      .populate('user', 'name department rollNo collegeName userType')
      .sort({ createdAt: -1 });

    const totalReviews = feedbacks.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              feedbacks.reduce((acc, curr) => acc + curr.rating, 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      if (distribution[f.rating] !== undefined) {
        distribution[f.rating]++;
      }
    });

    res.status(200).json({
      success: true,
      totalReviews,
      averageRating,
      distribution,
      feedbacks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getMyEventFeedback,
  getEventFeedback
};
