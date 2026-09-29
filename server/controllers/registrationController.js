const crypto = require('crypto');
const qrcode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateOdLetterPDF } = require('../utils/pdfOdLetter');
const {
  generateRotatingToken,
  verifyRotatingToken,
  generateRotatingQrDataUrl
} = require('../utils/rotatingQr');

// Helper to generate unique human-readable ticket code
const generateTicketCode = () => {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `EH-${year}-${randomPart}`;
};

// @desc    Register current user for an event
// @route   POST /api/registrations/register/:eventId
// @access  Private (student, internal, external)
const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { customFieldResponses = {} } = req.body;
    const event = await Event.findById(eventId).populate('template');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this event as it is not yet approved.'
      });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed.'
      });
    }

    // Check capacity
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event capacity reached. No seats available.'
      });
    }

    // Check allowed user type
    if (
      event.allowedUserTypes &&
      event.allowedUserTypes.length > 0 &&
      !event.allowedUserTypes.includes(req.user.userType)
    ) {
      return res.status(403).json({
        success: false,
        message: `This event is restricted to ${event.allowedUserTypes.join(' and ')} participants.`
      });
    }

    // Validate dynamic template customFields for registration
    if (event.template && Array.isArray(event.template.customFields)) {
      for (const field of event.template.customFields) {
        if (field.target === 'registration' || field.target === 'both') {
          if (field.required) {
            const val = customFieldResponses[field.name];
            if (val === undefined || val === null || val === '') {
              return res.status(400).json({
                success: false,
                message: `Registration field "${field.label}" is required.`
              });
            }
          }
        }
      }
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      user: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event.',
        ticket: existingRegistration
      });
    }

    // Generate unique code & QR code
    let ticketCode = generateTicketCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await Registration.findOne({ ticketCode });
      if (!existing) isUnique = true;
      else ticketCode = generateTicketCode();
    }

    const qrPayload = JSON.stringify({
      code: ticketCode,
      evt: event._id.toString(),
      usr: req.user._id.toString(),
      ts: Date.now()
    });

    const qrCodeDataUrl = await qrcode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#312e81',
        light: '#ffffff'
      }
    });

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      ticketCode,
      qrCodeDataUrl,
      customFieldResponses,
      status: 'confirmed',
      checkedIn: false
    });

    // Auto-generate Lunch and Refreshment QR coupons for this attendee
    try {
      const { ensureCouponsForRegistration } = require('./foodCouponController');
      await ensureCouponsForRegistration(registration._id, req.user._id, event._id);
    } catch (couponErr) {
      console.error('Failed to auto-generate food coupons:', couponErr);
    }

    // Increment registeredCount on Event
    await Event.findByIdAndUpdate(eventId, {
      $inc: { registeredCount: 1 }
    });

    const populated = await Registration.findById(registration._id)
      .populate('event', 'title startDate endDate venueLocation venueMode bannerUrl category department')
      .populate('user', 'name email rollNo department collegeName userType');

    res.status(201).json({
      success: true,
      message: 'Registration confirmed! Your digital QR ticket is ready.',
      ticket: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registrations/tickets for logged in user
// @route   GET /api/registrations/my-tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Registration.find({ user: req.user._id })
      .populate(
        'event',
        'title description startDate endDate venueLocation venueMode bannerUrl category department status'
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ticket details by ticketCode
// @route   GET /api/registrations/ticket/:ticketCode
// @access  Private
const getTicketByCode = async (req, res, next) => {
  try {
    const ticket = await Registration.findOne({ ticketCode: req.params.ticketCode })
      .populate('event')
      .populate('user', 'name email rollNo department collegeName phone userType')
      .populate('checkedInBy', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket code. Ticket not found.'
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendees for a specific event
// @route   GET /api/registrations/event/:eventId/attendees
// @access  Private (Organizer, Admin, HOD)
const getEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { search, checkedIn } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Role check: Organizer of this event or Admin/HOD
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isStaff = ['admin', 'principal'].includes(req.user.role) || (req.user.role === 'hod' && req.user.department === event.department);

    if (!isOrganizer && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view attendee records for this event.'
      });
    }

    const query = { event: eventId };

    if (checkedIn === 'true') {
      query.checkedIn = true;
    } else if (checkedIn === 'false') {
      query.checkedIn = false;
    }

    let registrations = await Registration.find(query)
      .populate('user', 'name email rollNo department collegeName phone userType')
      .populate('checkedInBy', 'name email role')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      registrations = registrations.filter(
        (r) =>
          r.user?.name?.toLowerCase().includes(s) ||
          r.user?.email?.toLowerCase().includes(s) ||
          r.user?.rollNo?.toLowerCase().includes(s) ||
          r.ticketCode.toLowerCase().includes(s)
      );
    }

    const checkedInCount = await Registration.countDocuments({
      event: eventId,
      checkedIn: true
    });

    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        capacity: event.capacity,
        registeredCount: event.registeredCount,
        checkedInCount
      },
      count: registrations.length,
      attendees: registrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live rotating QR code (changes every 30s)
// @route   GET /api/registrations/ticket/:ticketCode/rotating-qr
// @access  Private (Ticket owner, Organizer, Admin)
const getRotatingQr = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;

    const registration = await Registration.findOne({
      ticketCode: ticketCode.trim().toUpperCase()
    })
      .populate('event', 'title startDate endDate venueLocation venueMode attendanceWindow status')
      .populate('user', 'name email rollNo department collegeName');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    // Access check: owner of ticket or staff/organizer
    const isOwner = registration.user._id.toString() === req.user._id.toString();
    const isStaff = ['admin', 'principal', 'organizer', 'hod'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket QR code.'
      });
    }

    const event = registration.event;
    const now = new Date();

    const windowStart = event?.attendanceWindow?.customStart
      ? new Date(event.attendanceWindow.customStart)
      : (event?.startDate ? new Date(new Date(event.startDate).getTime() - (event?.attendanceWindow?.bufferMinutesBefore ?? 60) * 60000) : null);

    const windowEnd = event?.attendanceWindow?.customEnd
      ? new Date(event.attendanceWindow.customEnd)
      : (event?.endDate ? new Date(new Date(event.endDate).getTime() + (event?.attendanceWindow?.bufferMinutesAfter ?? 60) * 60000) : null);

    const isWindowOpen = (!windowStart || now >= windowStart) && (!windowEnd || now <= windowEnd);

    // Generate rotating token (HMAC-SHA256 based on 30s window)
    const tokenInfo = generateRotatingToken(registration.ticketCode);
    const qrCodeDataUrl = await generateRotatingQrDataUrl(tokenInfo.token);

    res.status(200).json({
      success: true,
      ticketCode: registration.ticketCode,
      token: tokenInfo.token,
      expiresInSeconds: tokenInfo.expiresInSeconds,
      expiresInMs: tokenInfo.expiresInMs,
      windowIndex: tokenInfo.windowIndex,
      qrCodeDataUrl,
      checkedIn: registration.checkedIn,
      checkedInAt: registration.checkedInAt,
      event: {
        _id: event?._id,
        title: event?.title,
        startDate: event?.startDate,
        endDate: event?.endDate,
        venueLocation: event?.venueLocation,
        attendanceWindow: {
          isOpen: isWindowOpen,
          start: windowStart,
          end: windowEnd
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in attendee by QR ticketCode or Rotating Token
// @route   POST /api/registrations/check-in
// @access  Private (Organizer, Admin)
const checkInAttendee = async (req, res, next) => {
  try {
    const rawInput = (req.body.token || req.body.ticketCode || '').trim();
    const { eventId } = req.body;

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: 'Ticket code or rotating QR token is required for check-in.'
      });
    }

    // Determine lookup ticket code (extract from rotating token if prefixed with RQR-)
    let lookupCode = rawInput;
    let isRotating = false;
    if (rawInput.startsWith('RQR-')) {
      isRotating = true;
      const parts = rawInput.split('-');
      if (parts.length >= 5) {
        lookupCode = parts.slice(1, parts.length - 2).join('-');
      }
    }

    // Find registration
    const registration = await Registration.findOne({
      ticketCode: lookupCode.trim().toUpperCase()
    })
      .populate('event', 'title organizer startDate endDate venueLocation attendanceWindow')
      .populate('user', 'name email rollNo department collegeName userType');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket. No registration found matching this code.'
      });
    }

    // If eventId provided, verify it matches
    if (eventId && registration.event._id.toString() !== eventId.toString()) {
      return res.status(400).json({
        success: false,
        message: `Ticket belongs to "${registration.event.title}", not this event.`
      });
    }

    // Verify operator permission
    const isOrganizer = registration.event.organizer.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'principal'].includes(req.user.role);

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to check in attendees for this event.'
      });
    }

    // Verify rotating token freshness if rotating format
    if (isRotating) {
      const verifyResult = verifyRotatingToken(rawInput, registration.ticketCode);
      if (!verifyResult.isValid) {
        return res.status(400).json({
          success: false,
          isExpired: verifyResult.isExpired || false,
          message: verifyResult.error || 'Invalid or expired rotating QR code. Please ask the attendee to present their live rotating pass.'
        });
      }
    }

    // Verify Event Attendance Window: backend rejects scans outside the attendance window
    const event = registration.event;
    const now = new Date();

    const windowStart = event?.attendanceWindow?.customStart
      ? new Date(event.attendanceWindow.customStart)
      : (event?.startDate ? new Date(new Date(event.startDate).getTime() - (event?.attendanceWindow?.bufferMinutesBefore ?? 60) * 60000) : null);

    const windowEnd = event?.attendanceWindow?.customEnd
      ? new Date(event.attendanceWindow.customEnd)
      : (event?.endDate ? new Date(new Date(event.endDate).getTime() + (event?.attendanceWindow?.bufferMinutesAfter ?? 60) * 60000) : null);

    if (windowStart && now < windowStart) {
      return res.status(400).json({
        success: false,
        isOutsideWindow: true,
        message: `Attendance check-in window is not open yet. Check-in opens at ${windowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${windowStart.toLocaleDateString()}.`,
        windowStart,
        windowEnd
      });
    }

    if (windowEnd && now > windowEnd) {
      return res.status(400).json({
        success: false,
        isOutsideWindow: true,
        message: `Attendance check-in window has ended. Check-in closed at ${windowEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${windowEnd.toLocaleDateString()}.`,
        windowStart,
        windowEnd
      });
    }

    // Check if already checked in
    if (registration.checkedIn) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'Attendee has ALREADY been checked in!',
        checkedInAt: registration.checkedInAt,
        attendee: {
          name: registration.user?.name,
          email: registration.user?.email,
          rollNo: registration.user?.rollNo,
          ticketCode: registration.ticketCode
        }
      });
    }

    // Mark as checked in
    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    registration.checkedInBy = req.user._id;
    registration.status = 'attended';
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Attendee successfully checked in!',
      ticketCode: registration.ticketCode,
      checkedInAt: registration.checkedInAt,
      attendee: {
        name: registration.user?.name,
        email: registration.user?.email,
        rollNo: registration.user?.rollNo,
        department: registration.user?.department,
        collegeName: registration.user?.collegeName,
        userType: registration.user?.userType
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download On Duty (OD) Letter PDF for internal students after attendance is marked
// @route   GET /api/registrations/od-letter/:eventId
// @access  Private (Internal student)
const downloadOdLetter = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Check user type: internal students only
    if (req.user.userType !== 'internal') {
      return res.status(403).json({
        success: false,
        message: 'OD letters are strictly available for internal college students only.'
      });
    }

    // Find registration record for this user and event
    const registration = await Registration.findOne({
      event: eventId,
      user: req.user._id
    }).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found for this event.'
      });
    }

    // Ensure physical attendance is marked
    if (!registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'OD Letter cannot be generated until your physical attendance is verified and marked by gate check-in.'
      });
    }

    const event = registration.event;
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Associated event not found.'
      });
    }

    const startDateStr = new Date(event.startDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const endDateStr = new Date(event.endDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const scheduleStr = startDateStr === endDateStr ? startDateStr : `${startDateStr} to ${endDateStr}`;

    const odRefNo = `OD/AIT/${new Date().getFullYear()}/${registration.ticketCode.replace('EH-', '')}`;

    const data = {
      odRefNo,
      issueDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      studentName: req.user.name,
      rollNo: req.user.rollNo || 'AIT-STU',
      studentDepartment: req.user.department || 'Computer Science & Engineering',
      studentYear: req.user.year ? `Year ${req.user.year}` : 'Undergraduate',
      eventTitle: event.title,
      eventCategory: event.category ? event.category.toUpperCase() : 'CAMPUS EVENT',
      eventDepartment: event.department || 'Office of Student Affairs',
      venueLocation: event.venue || 'Campus Auditorium',
      eventSchedule: scheduleStr,
      ticketCode: registration.ticketCode,
      checkedInAt: registration.checkedInAt
        ? new Date(registration.checkedInAt).toLocaleString('en-IN')
        : 'Gate Verified'
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="OD-Letter-${registration.ticketCode}.pdf"`
    );

    await generateOdLetterPDF(data, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  getMyTickets,
  getTicketByCode,
  getRotatingQr,
  getEventAttendees,
  checkInAttendee,
  downloadOdLetter
};

