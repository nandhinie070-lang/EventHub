const EventTemplate = require('../models/EventTemplate');

// Default initial templates to seed if none exist
const DEFAULT_TEMPLATES = [
  {
    name: 'Technical Hackathon',
    category: 'Hackathon',
    description: 'Template for 24-48 hour coding marathons, product builds, and team competitions.',
    customFields: [
      {
        name: 'problemStatements',
        label: 'Problem Statement Themes',
        type: 'textarea',
        required: true,
        placeholder: 'e.g. AI for Healthcare, Smart Campus, FinTech...',
        target: 'event',
        description: 'Provide thematic tracks for the participants.'
      },
      {
        name: 'maxTeamSize',
        label: 'Maximum Team Size Limit',
        type: 'number',
        required: true,
        placeholder: '4',
        target: 'event',
        description: 'Maximum allowable members per team.'
      },
      {
        name: 'teamName',
        label: 'Team Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Binary Beasts',
        target: 'registration',
        description: 'Name of your registered team.'
      },
      {
        name: 'teamSize',
        label: 'Team Members Count',
        type: 'number',
        required: true,
        placeholder: '4',
        target: 'registration',
        description: 'Total number of teammates.'
      },
      {
        name: 'githubRepo',
        label: 'GitHub / Portfolio URL',
        type: 'url',
        required: false,
        placeholder: 'https://github.com/username',
        target: 'registration',
        description: 'Link to showcase prior project commits.'
      },
      {
        name: 'tshirtSize',
        label: 'T-Shirt Size',
        type: 'select',
        required: true,
        options: ['S', 'M', 'L', 'XL', 'XXL'],
        target: 'registration',
        description: 'Size for commemorative event swag.'
      }
    ]
  },
  {
    name: 'Workshop & Hands-On Lab',
    category: 'Workshop',
    description: 'Practical, guided training sessions requiring specific technical setups and lab resources.',
    customFields: [
      {
        name: 'prerequisites',
        label: 'Prerequisites & Tools',
        type: 'textarea',
        required: true,
        placeholder: 'e.g. Python 3.10+, Docker Desktop installed...',
        target: 'event',
        description: 'Prerequisites participants must prepare before arriving.'
      },
      {
        name: 'labType',
        label: 'Lab Infrastructure Type',
        type: 'select',
        required: true,
        options: ['High-Performance GPU Lab', 'Networking Lab', 'General CS Lab', 'BYOD (Bring Your Own Device)'],
        target: 'event',
        description: 'Type of campus laboratory booked.'
      },
      {
        name: 'skillLevel',
        label: 'Experience Level in Topic',
        type: 'select',
        required: true,
        options: ['Beginner (Zero prior experience)', 'Intermediate (Familiar with basics)', 'Advanced (Active practitioner)'],
        target: 'registration',
        description: 'Self-assessment of your domain knowledge.'
      },
      {
        name: 'needCollegeLaptop',
        label: 'Require College Workstation / Laptop?',
        type: 'select',
        required: true,
        options: ['No, I will bring my personal laptop', 'Yes, I request a campus lab PC workstation'],
        target: 'registration',
        description: 'Assistance for attendees without personal machines.'
      }
    ]
  },
  {
    name: 'Guest Lecture & Distinguished Seminar',
    category: 'Seminar',
    description: 'Expert talks, keynotes, and academic colloquiums with industry dignitaries.',
    customFields: [
      {
        name: 'speakerName',
        label: 'Keynote Speaker Full Name',
        type: 'text',
        required: true,
        placeholder: 'Dr. Jane Doe, Chief Scientist at Tech Corp',
        target: 'event',
        description: 'Name and designation of guest speaker.'
      },
      {
        name: 'speakerBio',
        label: 'Speaker Biography & Honors',
        type: 'textarea',
        required: true,
        placeholder: 'Distinguished profile, notable research publications...',
        target: 'event',
        description: 'Profile to feature on event brochure.'
      },
      {
        name: 'questionsForSpeaker',
        label: 'Questions or Topics of Interest for Q&A',
        type: 'textarea',
        required: false,
        placeholder: 'Specific challenges you would like addressed during speaker Q&A...',
        target: 'registration',
        description: 'Curated queries for the moderator.'
      }
    ]
  }
];

// @desc    Get all active event templates (auto-seeds defaults if empty)
// @route   GET /api/event-templates
// @access  Public / Authenticated
const getTemplates = async (req, res, next) => {
  try {
    let templates = await EventTemplate.find({ isActive: true }).sort({ createdAt: -1 });

    // Auto-seed defaults if database currently has none
    if (templates.length === 0) {
      await EventTemplate.insertMany(DEFAULT_TEMPLATES);
      templates = await EventTemplate.find({ isActive: true }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single template by ID
// @route   GET /api/event-templates/:id
// @access  Public / Authenticated
const getTemplateById = async (req, res, next) => {
  try {
    const template = await EventTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Event template not found'
      });
    }

    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event template with customFields
// @route   POST /api/event-templates
// @access  Private (Admin only)
const createTemplate = async (req, res, next) => {
  try {
    const { name, category, description, customFields } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Template name and description are required.'
      });
    }

    const existing = await EventTemplate.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An event template with this name already exists.'
      });
    }

    // Format and sanitize custom fields
    const formattedFields = (customFields || []).map((f) => ({
      name: f.name || f.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: f.label,
      type: f.type || 'text',
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options : typeof f.options === 'string' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : [],
      placeholder: f.placeholder || '',
      target: f.target || 'registration',
      description: f.description || ''
    }));

    const template = await EventTemplate.create({
      name: name.trim(),
      category: category || 'Technical',
      description: description.trim(),
      customFields: formattedFields,
      createdBy: req.user._id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: `Template "${template.name}" created with ${template.customFields.length} dynamic custom fields.`,
      template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event template
// @route   PUT /api/event-templates/:id
// @access  Private (Admin only)
const updateTemplate = async (req, res, next) => {
  try {
    let template = await EventTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Event template not found'
      });
    }

    const { name, category, description, customFields, isActive } = req.body;

    if (name) template.name = name.trim();
    if (category) template.category = category;
    if (description) template.description = description.trim();
    if (typeof isActive === 'boolean') template.isActive = isActive;

    if (customFields && Array.isArray(customFields)) {
      template.customFields = customFields.map((f) => ({
        name: f.name || f.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        label: f.label,
        type: f.type || 'text',
        required: Boolean(f.required),
        options: Array.isArray(f.options) ? f.options : typeof f.options === 'string' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : [],
        placeholder: f.placeholder || '',
        target: f.target || 'registration',
        description: f.description || ''
      }));
    }

    await template.save();

    res.status(200).json({
      success: true,
      message: 'Event template updated successfully.',
      template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event template
// @route   DELETE /api/event-templates/:id
// @access  Private (Admin only)
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await EventTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Event template not found'
      });
    }

    await EventTemplate.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Template "${template.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
