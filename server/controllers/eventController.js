const Event = require('../models/Event');
const EventTemplate = require('../models/EventTemplate');
const Registration = require('../models/Registration');
const FoodCoupon = require('../models/FoodCoupon');
const Feedback = require('../models/Feedback');
const Issue = require('../models/Issue');
const { generateEventReportPDF } = require('../utils/pdfEventReport');

// Helper to detect venue conflicts
const detectVenueClash = async (
  venueLocation,
  venueMode,
  startDate,
  endDate,
  excludeEventId = null
) => {
  if (!venueLocation || venueMode === 'online') {
    return null;
  }

  const query = {
    venueLocation: {
      $regex: new RegExp(`^${venueLocation.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    },
    venueMode: { $in: ['offline', 'hybrid'] },
    status: { $in: ['approved', 'pending_hod', 'pending_principal'] },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) }
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  return await Event.findOne(query).populate('organizer', 'name email department');
};

// @desc    Get all events with filters & search
// @route   GET /api/events
// @access  Public (or filtered for authenticated roles)
const getEvents = async (req, res, next) => {
  try {
    const {
      search,
      category,
      department,
      status,
      venueMode,
      organizer,
      limit = 20,
      page = 1
    } = req.query;

    const query = {};

    // By default, unauthenticated or student requests should only view approved events
    const isStaffOrAdmin =
      req.user && ['organizer', 'hod', 'principal', 'admin'].includes(req.user.role);

    if (status) {
      query.status = status;
    } else if (!isStaffOrAdmin) {
      query.status = 'approved';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (venueMode && venueMode !== 'All') {
      query.venueMode = venueMode;
    }

    if (organizer) {
      query.organizer = organizer;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate('organizer', 'name email department rollNo')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email department phone')
      .populate('coOrganizers', 'name email department')
      .populate('template')
      .populate('approvals.hod.reviewedBy', 'name email role')
      .populate('approvals.principal.reviewedBy', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check venue clash availability
// @route   POST /api/events/check-venue-clash
// @access  Private (organizer, admin)
const checkVenueClashEndpoint = async (req, res, next) => {
  try {
    const { venueLocation, venueMode, startDate, endDate, excludeEventId } = req.body;

    if (!venueLocation || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide venue location, start date, and end date.'
      });
    }

    const conflict = await detectVenueClash(
      venueLocation,
      venueMode,
      startDate,
      endDate,
      excludeEventId
    );

    if (conflict) {
      const conflictStart = new Date(conflict.startDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const conflictEnd = new Date(conflict.endDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      return res.status(200).json({
        success: true,
        hasClash: true,
        message: `Venue clash detected! "${conflict.venueLocation}" is already reserved for "${conflict.title}" (${conflictStart} - ${conflictEnd}).`,
        conflict: {
          id: conflict._id,
          title: conflict.title,
          department: conflict.department,
          organizerName: conflict.organizer?.name || 'Faculty Coordinator',
          venueLocation: conflict.venueLocation,
          startDate: conflict.startDate,
          endDate: conflict.endDate,
          status: conflict.status
        }
      });
    }

    res.status(200).json({
      success: true,
      hasClash: false,
      message: 'Venue is free and available during requested time window.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (organizer, admin)
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      department,
      startDate,
      endDate,
      registrationDeadline,
      venueMode,
      venueLocation,
      bannerUrl,
      capacity,
      isPaid,
      fee,
      allowedUserTypes,
      budget,
      tags,
      template,
      customFieldResponses
    } = req.body;

    if (
      !title ||
      !description ||
      !startDate ||
      !endDate ||
      !registrationDeadline ||
      !venueLocation
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required event details.'
      });
    }

    // 1. Venue Clash Detection
    const clash = await detectVenueClash(venueLocation, venueMode, startDate, endDate);
    if (clash) {
      const clashStart = new Date(clash.startDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const clashEnd = new Date(clash.endDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      return res.status(409).json({
        success: false,
        isClash: true,
        message: `Venue clash detected! "${clash.venueLocation}" is already reserved for "${clash.title}" (${clashStart} - ${clashEnd}).`,
        conflict: {
          id: clash._id,
          title: clash.title,
          department: clash.department,
          organizerName: clash.organizer?.name || 'Department Coordinator',
          venueLocation: clash.venueLocation,
          startDate: clash.startDate,
          endDate: clash.endDate,
          status: clash.status
        }
      });
    }

    // 2. Dynamic Template CustomField Validation (Event Scope)
    if (template) {
      const templateDoc = await EventTemplate.findById(template);
      if (templateDoc && Array.isArray(templateDoc.customFields)) {
        for (const field of templateDoc.customFields) {
          if (field.target === 'event' || field.target === 'both') {
            if (field.required) {
              const val = customFieldResponses && customFieldResponses[field.name];
              if (val === undefined || val === null || val === '') {
                return res.status(400).json({
                  success: false,
                  message: `Template field "${field.label}" is required for this event type.`
                });
              }
            }
          }
        }
      }
    }

    const eventDepartment =
      department || req.user.department || 'Computer Science & Engineering';

    // Organizers submit to HOD; Admins can auto-approve
    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending_hod';

    const event = await Event.create({
      title,
      description,
      category: category || 'Technical',
      department: eventDepartment,
      organizer: req.user._id,
      startDate,
      endDate,
      registrationDeadline,
      venueMode: venueMode || 'offline',
      venueLocation,
      bannerUrl:
        bannerUrl ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      capacity: capacity ? parseInt(capacity) : 100,
      isPaid: Boolean(isPaid),
      fee: isPaid ? Number(fee) : 0,
      allowedUserTypes: allowedUserTypes || ['internal', 'external'],
      budget: budget || { estimated: 0, breakdown: '' },
      tags: tags || [],
      template: template || undefined,
      customFieldResponses: customFieldResponses || {},
      status: initialStatus,
      approvals: {
        hod: {
          status: req.user.role === 'admin' ? 'approved' : 'pending',
          reviewedBy: req.user.role === 'admin' ? req.user._id : undefined,
          reviewedAt: req.user.role === 'admin' ? new Date() : undefined,
          remarks: req.user.role === 'admin' ? 'Admin auto-sanctioned' : ''
        },
        principal: {
          status: req.user.role === 'admin' ? 'approved' : 'pending',
          reviewedBy: req.user.role === 'admin' ? req.user._id : undefined,
          reviewedAt: req.user.role === 'admin' ? new Date() : undefined,
          remarks: req.user.role === 'admin' ? 'Admin auto-sanctioned' : ''
        }
      }
    });

    const populated = await Event.findById(event._id)
      .populate('organizer', 'name email department')
      .populate('template');

    res.status(201).json({
      success: true,
      message:
        initialStatus === 'approved'
          ? 'Event created and published successfully!'
          : 'Event proposal created and routed to Department HOD for approval.',
      event: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (organizer, admin)
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event.'
      });
    }

    // Organizers cannot update if already fully approved unless admin
    if (!isAdmin && event.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved events cannot be directly modified. Please contact administration.'
      });
    }

    // Check venue clash if venue or times are changing
    const checkLoc = req.body.venueLocation || event.venueLocation;
    const checkMode = req.body.venueMode || event.venueMode;
    const checkStart = req.body.startDate || event.startDate;
    const checkEnd = req.body.endDate || event.endDate;

    const clash = await detectVenueClash(
      checkLoc,
      checkMode,
      checkStart,
      checkEnd,
      event._id
    );

    if (clash) {
      const clashStart = new Date(clash.startDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const clashEnd = new Date(clash.endDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      return res.status(409).json({
        success: false,
        isClash: true,
        message: `Venue clash detected! "${clash.venueLocation}" is already reserved for "${clash.title}" (${clashStart} - ${clashEnd}).`,
        conflict: {
          id: clash._id,
          title: clash.title,
          department: clash.department,
          organizerName: clash.organizer?.name || 'Department Coordinator',
          venueLocation: clash.venueLocation,
          startDate: clash.startDate,
          endDate: clash.endDate,
          status: clash.status
        }
      });
    }

    // If event was rejected and organizer updates it, reset status to pending_hod
    if (event.status === 'rejected' && isOwner) {
      req.body.status = 'pending_hod';
      req.body['approvals.hod.status'] = 'pending';
      req.body['approvals.principal.status'] = 'pending';
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('organizer', 'name email department')
      .populate('template');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (organizer, admin)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event.'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    HOD approval / rejection
// @route   PATCH /api/events/:id/approve-hod
// @access  Private (HOD, Admin)
const approveHod = async (req, res, next) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' | 'reject'
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ensure HOD is from same department unless admin
    if (req.user.role === 'hod' && event.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: As HOD of ${req.user.department}, you can only review events in your department.`
      });
    }

    if (action === 'approve') {
      event.approvals.hod.status = 'approved';
      event.approvals.hod.reviewedBy = req.user._id;
      event.approvals.hod.reviewedAt = new Date();
      event.approvals.hod.remarks = remarks || 'Approved by HOD';
      event.status = 'pending_principal';
    } else if (action === 'reject') {
      event.approvals.hod.status = 'rejected';
      event.approvals.hod.reviewedBy = req.user._id;
      event.approvals.hod.reviewedAt = new Date();
      event.approvals.hod.remarks = remarks || 'Rejected by HOD';
      event.status = 'rejected';
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Expected 'approve' or 'reject'."
      });
    }

    await event.save();

    const updated = await Event.findById(event._id)
      .populate('organizer', 'name email department')
      .populate('approvals.hod.reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message:
        action === 'approve'
          ? 'Event approved by HOD and routed to Principal for final sanction!'
          : 'Event proposal rejected by HOD.',
      event: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Principal approval / rejection
// @route   PATCH /api/events/:id/approve-principal
// @access  Private (Principal, Admin)
const approvePrincipal = async (req, res, next) => {
  try {
    const { action, remarks } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (action === 'approve') {
      event.approvals.principal.status = 'approved';
      event.approvals.principal.reviewedBy = req.user._id;
      event.approvals.principal.reviewedAt = new Date();
      event.approvals.principal.remarks = remarks || 'Approved by Principal';
      event.status = 'approved'; // Fully live and open for registration
    } else if (action === 'reject') {
      event.approvals.principal.status = 'rejected';
      event.approvals.principal.reviewedBy = req.user._id;
      event.approvals.principal.reviewedAt = new Date();
      event.approvals.principal.remarks = remarks || 'Rejected by Principal';
      event.status = 'rejected';
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Expected 'approve' or 'reject'."
      });
    }

    await event.save();

    const updated = await Event.findById(event._id)
      .populate('organizer', 'name email department')
      .populate('approvals.hod.reviewedBy', 'name email role')
      .populate('approvals.principal.reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message:
        action === 'approve'
          ? 'Event officially sanctioned by Principal! It is now live on the campus catalog.'
          : 'Event proposal rejected by Principal.',
      event: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending approvals for current reviewer
// @route   GET /api/events/pending-approvals
// @access  Private (HOD, Principal, Admin)
const getPendingApprovals = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'hod') {
      filter = {
        department: req.user.department,
        status: 'pending_hod'
      };
    } else if (req.user.role === 'principal') {
      filter = {
        status: 'pending_principal'
      };
    } else if (req.user.role === 'admin') {
      filter = {
        status: { $in: ['pending_hod', 'pending_principal'] }
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only HODs, Principals, and Admins can view pending approvals.'
      });
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name email department rollNo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate and download comprehensive Event Closure & Analytics Report PDF
// @route   GET /api/events/:id/report-pdf
// @access  Private (Organizer, HOD, Principal, Admin)
const downloadEventReportPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate('organizer', 'name email department');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Role check: Only event organizer, department HOD, Principal, or Admin
    const isOrganizer =
      event.organizer && event.organizer._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'principal'].includes(req.user.role);
    const isHod = req.user.role === 'hod' && req.user.department === event.department;

    if (!isOrganizer && !isAdmin && !isHod) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download this post-event audit report.'
      });
    }

    // Query registrations
    const registrations = await Registration.find({ event: event._id }).populate(
      'user',
      'name email userType department rollNo'
    );

    // Query food coupons
    const foodCoupons = await FoodCoupon.find({ event: event._id });

    // Query feedbacks
    const feedbacks = await Feedback.find({ event: event._id }).populate(
      'user',
      'name rollNo department'
    );

    // Query issues
    const issues = await Issue.find({ event: event._id });

    // Compute metrics
    const totalRegistrations = registrations.length;
    const totalAttended = registrations.filter((r) => r.checkedIn).length;
    const noShowCount = Math.max(0, totalRegistrations - totalAttended);
    const attendanceRate =
      totalRegistrations > 0
        ? `${((totalAttended / totalRegistrations) * 100).toFixed(1)}%`
        : '0.0%';
    const noShowRate =
      totalRegistrations > 0
        ? `${((noShowCount / totalRegistrations) * 100).toFixed(1)}%`
        : '0.0%';

    const internalRegistrations = registrations.filter(
      (r) => r.user?.userType === 'internal'
    ).length;
    const internalAttendees = registrations.filter(
      (r) => r.checkedIn && r.user?.userType === 'internal'
    ).length;
    const externalRegistrations = registrations.filter(
      (r) => r.user?.userType === 'external'
    ).length;
    const externalAttendees = registrations.filter(
      (r) => r.checkedIn && r.user?.userType === 'external'
    ).length;

    // Food
    const lunchCoupons = foodCoupons.filter((c) => c.couponType === 'lunch');
    const lunchTotal = lunchCoupons.length;
    const lunchRedeemed = lunchCoupons.filter((c) => c.isRedeemed).length;
    const lunchRate =
      lunchTotal > 0 ? `${((lunchRedeemed / lunchTotal) * 100).toFixed(1)}%` : '0.0%';

    const refrCoupons = foodCoupons.filter((c) => c.couponType === 'refreshment');
    const refrTotal = refrCoupons.length;
    const refrRedeemed = refrCoupons.filter((c) => c.isRedeemed).length;
    const refrRate =
      refrTotal > 0 ? `${((refrRedeemed / refrTotal) * 100).toFixed(1)}%` : '0.0%';

    // Feedback
    const totalFeedbacks = feedbacks.length;
    const averageRating =
      totalFeedbacks > 0
        ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedbacks).toFixed(1)
        : '5.0';

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((f) => {
      if (ratingCounts[f.rating] !== undefined) ratingCounts[f.rating]++;
    });

    const recentFeedbacks = feedbacks.slice(-4).map((f) => ({
      userName: f.user?.name || 'Attendee',
      rating: f.rating,
      comment: f.comment
    }));

    // Issues
    const totalIssues = issues.length;
    const resolvedIssues = issues.filter((i) =>
      ['Resolved', 'Confirmed'].includes(i.stage)
    ).length;
    const inProgressIssues = issues.filter((i) =>
      ['Reported', 'Acknowledged', 'Assigned', 'In Progress'].includes(i.stage)
    ).length;
    const escalatedIssues = issues.filter((i) => i.isEscalated).length;

    const categoryCounts = {
      food: 0,
      seating: 0,
      venue: 0,
      'audio-visual': 0,
      cleanliness: 0,
      other: 0
    };
    const categoryResolvedCounts = {
      food: 0,
      seating: 0,
      venue: 0,
      'audio-visual': 0,
      cleanliness: 0,
      other: 0
    };
    const categoryEscalatedCounts = {
      food: 0,
      seating: 0,
      venue: 0,
      'audio-visual': 0,
      cleanliness: 0,
      other: 0
    };

    issues.forEach((iss) => {
      if (categoryCounts[iss.category] !== undefined) categoryCounts[iss.category]++;
      if (['Resolved', 'Confirmed'].includes(iss.stage)) {
        if (categoryResolvedCounts[iss.category] !== undefined)
          categoryResolvedCounts[iss.category]++;
      }
      if (iss.isEscalated) {
        if (categoryEscalatedCounts[iss.category] !== undefined)
          categoryEscalatedCounts[iss.category]++;
      }
    });

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
    const scheduleStr =
      startDateStr === endDateStr ? startDateStr : `${startDateStr} to ${endDateStr}`;

    const reportRefNo = `EVR/AIT/${new Date().getFullYear()}/${event._id
      .toString()
      .slice(-6)
      .toUpperCase()}`;

    const reportData = {
      reportRefNo,
      generatedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      event: {
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        category: event.category,
        department: event.department || 'Office of Student Affairs',
        venue: event.venue || 'Campus Auditorium',
        schedule: scheduleStr,
        capacity: event.capacity,
        organizerName: event.organizer?.name || 'Faculty Coordinator',
        organizerEmail: event.organizer?.email || 'events@apex.edu',
        status: event.status
      },
      metrics: {
        totalRegistrations,
        totalAttended,
        attendanceRate,
        noShowCount,
        noShowRate,
        internalRegistrations,
        internalAttendees,
        externalRegistrations,
        externalAttendees,
        lunchTotal,
        lunchRedeemed,
        lunchRate,
        refrTotal,
        refrRedeemed,
        refrRate,
        totalFeedbacks,
        averageRating,
        ratingCounts,
        recentFeedbacks,
        totalIssues,
        resolvedIssues,
        inProgressIssues,
        escalatedIssues,
        categoryCounts,
        categoryResolvedCounts,
        categoryEscalatedCounts
      }
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Event-Report-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
    );

    await generateEventReportPDF(reportData, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveHod,
  approvePrincipal,
  getPendingApprovals,
  downloadEventReportPDF,
  checkVenueClashEndpoint
};
