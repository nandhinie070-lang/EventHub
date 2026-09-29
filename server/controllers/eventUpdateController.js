const EventUpdate = require('../models/EventUpdate');
const Event = require('../models/Event');

// @desc    Post a new update for an event
// @route   POST /api/event-updates/:eventId
// @access  Private (Organizer of this event, Admin)
const createUpdate = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { category, title, message, priority } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Role & Ownership check
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the event organizer or administration can post event updates.'
      });
    }

    // Category validation
    const allowedCategories = ['venue', 'time', 'lunch', 'refreshments', 'other'];
    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${allowedCategories.join(', ')}`
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Update title is required.'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Update message content is required.'
      });
    }

    const update = await EventUpdate.create({
      event: eventId,
      postedBy: req.user._id,
      category,
      title: title.trim(),
      message: message.trim(),
      priority: priority === 'urgent' ? 'urgent' : 'normal'
    });

    const populated = await EventUpdate.findById(update._id).populate(
      'postedBy',
      'name email role department'
    );

    res.status(201).json({
      success: true,
      message: 'Event update broadcasted successfully!',
      update: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all updates for an event as a timeline
// @route   GET /api/event-updates/:eventId
// @access  Public
const getEventUpdates = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const updates = await EventUpdate.find({ event: eventId })
      .populate('postedBy', 'name role department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: updates.length,
      updates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an update
// @route   DELETE /api/event-updates/:updateId
// @access  Private (Organizer, Admin)
const deleteUpdate = async (req, res, next) => {
  try {
    const { updateId } = req.params;
    const update = await EventUpdate.findById(updateId).populate('event');

    if (!update) {
      return res.status(404).json({ success: false, message: 'Update not found.' });
    }

    const isOwner =
      update.event?.organizer?.toString() === req.user._id.toString() ||
      update.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot delete this update.'
      });
    }

    await EventUpdate.findByIdAndDelete(updateId);

    res.status(200).json({
      success: true,
      message: 'Update deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUpdate,
  getEventUpdates,
  deleteUpdate
};
