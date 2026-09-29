const Issue = require('../models/Issue');
const Event = require('../models/Event');
const User = require('../models/User');

// Helper to check and mark SLA breaches on issues
const checkAndMarkSlaBreaches = async (issues) => {
  const now = new Date();
  for (const issue of issues) {
    if (
      !issue.isEscalated &&
      !['Resolved', 'Confirmed'].includes(issue.stage) &&
      issue.slaDeadline &&
      now > new Date(issue.slaDeadline)
    ) {
      issue.isEscalated = true;
      issue.escalatedAt = now;
      issue.escalationReason = `SLA deadline breached at stage: ${issue.stage}`;
      await issue.save();
    }
  }
};

// @desc    Report a new issue
// @route   POST /api/issues/:eventId
// @access  Private (Attendees, Students)
const createIssue = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { category, description, photoUrl, priority } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const validCategories = ['food', 'seating', 'venue', 'audio-visual', 'cleanliness', 'other'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Issue description is required.'
      });
    }

    // Auto high-priority rule: if 10+ reports in this category for this event
    const categoryCount = await Issue.countDocuments({
      event: eventId,
      category
    });

    const isAutoHigh = categoryCount + 1 >= 10;
    const initialPriority = isAutoHigh
      ? 'high'
      : priority && ['low', 'medium', 'high', 'critical'].includes(priority)
      ? priority
      : 'medium';

    // If threshold reached, elevate existing lower-priority issues in this category
    if (isAutoHigh) {
      await Issue.updateMany(
        {
          event: eventId,
          category,
          priority: { $in: ['low', 'medium'] }
        },
        {
          $set: {
            priority: 'high',
            escalationReason: 'Auto-elevated to HIGH priority due to 10+ reports in category'
          }
        }
      );
    }

    const slaDeadline = Issue.computeSlaDeadline('Reported');

    const issue = await Issue.create({
      event: eventId,
      reportedBy: userId,
      category,
      description: description.trim(),
      photoUrl: photoUrl || '',
      priority: initialPriority,
      stage: 'Reported',
      slaDeadline,
      isEscalated: false,
      stageHistory: [
        {
          stage: 'Reported',
          changedBy: userId,
          notes: isAutoHigh
            ? 'Issue reported (Auto-elevated to HIGH priority: 10+ reports in category)'
            : 'Issue reported by attendee',
          timestamp: new Date()
        }
      ]
    });

    const populated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email rollNo department')
      .populate('event', 'title venueLocation');

    res.status(201).json({
      success: true,
      message: isAutoHigh
        ? 'Issue submitted! Category volume threshold (10+) reached &mdash; issue prioritized as HIGH.'
        : 'Issue successfully reported. Incident ticket created with active SLA timer.',
      issue: populated,
      autoElevated: isAutoHigh
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues for an event (Coordinator Issue Board)
// @route   GET /api/issues/event/:eventId
// @access  Private (Organizers, Staff, Admins)
const getEventIssues = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { stage, category, priority, isEscalated } = req.query;

    const query = { event: eventId };
    if (stage && stage !== 'All') query.stage = stage;
    if (category && category !== 'All') query.category = category;
    if (priority && priority !== 'All') query.priority = priority;
    if (isEscalated !== undefined && isEscalated !== '') {
      query.isEscalated = isEscalated === 'true';
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name rollNo department email')
      .populate('assignedTo', 'name role department')
      .populate('stageHistory.changedBy', 'name role')
      .sort({ createdAt: -1 });

    // Check SLAs and escalate overdue issues
    await checkAndMarkSlaBreaches(issues);

    // Summary counts for Coordinator Board
    const totalCount = await Issue.countDocuments({ event: eventId });
    const reportedCount = await Issue.countDocuments({ event: eventId, stage: 'Reported' });
    const inProgressCount = await Issue.countDocuments({
      event: eventId,
      stage: { $in: ['Acknowledged', 'Assigned', 'In Progress'] }
    });
    const resolvedCount = await Issue.countDocuments({
      event: eventId,
      stage: { $in: ['Resolved', 'Confirmed'] }
    });
    const escalatedCount = await Issue.countDocuments({ event: eventId, isEscalated: true });

    // Category breakdown
    const categoryStats = await Issue.aggregate([
      { $match: { event: new (require('mongoose').Types.ObjectId)(eventId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      count: issues.length,
      metrics: {
        total: totalCount,
        reported: reportedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        escalated: escalatedCount
      },
      categoryStats: categoryStats.map((c) => ({ category: c._id, count: c.count })),
      issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get issues reported by logged-in student (Student Tracker)
// @route   GET /api/issues/my
// @access  Private
const getMyIssues = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const issues = await Issue.find({ reportedBy: userId })
      .populate('event', 'title startDate venueLocation')
      .populate('assignedTo', 'name role')
      .populate('stageHistory.changedBy', 'name role')
      .sort({ createdAt: -1 });

    await checkAndMarkSlaBreaches(issues);

    res.status(200).json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue stage (Coordinator / Admin transition)
// @route   PATCH /api/issues/:issueId/stage
// @access  Private (Coordinator, Organizer, Admin)
const updateIssueStage = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { stage, notes, assignedTo } = req.body;

    const validStages = ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Confirmed'];
    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Expected: ${validStages.join(', ')}`
      });
    }

    const issue = await Issue.findById(issueId).populate('event');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    // Role check: Organizer of this event or Admin
    const isOwner = issue.event?.organizer?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'organizer'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only event organizers or administrators can advance issue stages.'
      });
    }

    issue.stage = stage;
    if (assignedTo) {
      issue.assignedTo = assignedTo;
    }

    // Compute fresh SLA deadline for newly transitioned stage
    if (!['Resolved', 'Confirmed'].includes(stage)) {
      issue.slaDeadline = Issue.computeSlaDeadline(stage);
      issue.isEscalated = false; // Reset escalation when actively handled
    }

    issue.stageHistory.push({
      stage,
      changedBy: req.user._id,
      notes: notes || `Stage transitioned to ${stage}`,
      timestamp: new Date()
    });

    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email rollNo department')
      .populate('assignedTo', 'name role')
      .populate('stageHistory.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message: `Issue stage updated to '${stage}'.`,
      issue: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student reopens a resolved issue
// @route   PATCH /api/issues/:issueId/reopen
// @access  Private (Original Reporter)
const reopenIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { reopenReason } = req.body;
    const userId = req.user._id;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (issue.reportedBy.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the original student reporter or an admin can reopen this issue.'
      });
    }

    if (issue.stage !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Only resolved issues can be reopened.'
      });
    }

    issue.stage = 'In Progress';
    issue.reopenCount += 1;
    issue.reopenReason = reopenReason || 'Issue persists according to student feedback';
    issue.slaDeadline = Issue.computeSlaDeadline('In Progress');
    issue.isEscalated = false;

    issue.stageHistory.push({
      stage: 'In Progress (Reopened)',
      changedBy: userId,
      notes: `Reopened by attendee: ${reopenReason || 'Issue persists'}`,
      timestamp: new Date()
    });

    await issue.save();

    res.status(200).json({
      success: true,
      message: 'Issue has been reopened and returned to In Progress queue.',
      issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all escalated issues (Admin Escalation Center)
// @route   GET /api/issues/escalated
// @access  Private (Admin)
const getEscalatedIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ isEscalated: true })
      .populate('event', 'title department startDate venueLocation')
      .populate('reportedBy', 'name rollNo department email')
      .populate('assignedTo', 'name role')
      .sort({ escalatedAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getEventIssues,
  getMyIssues,
  updateIssueStage,
  reopenIssue,
  getEscalatedIssues
};
