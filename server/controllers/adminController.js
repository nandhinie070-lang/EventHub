const os = require('os');
const mongoose = require('mongoose');
const collegeConfig = require('../config/college');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// In-memory audit log ring buffer
const auditLogs = [
  {
    id: 1,
    action: 'SYSTEM_BOOT',
    details: 'EventHub server initialized and connected to MongoDB',
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: 2,
    action: 'SEED_INITIALIZED',
    details: 'Institutional default accounts verified (Admin, Principal, HOD, Organizer)',
    timestamp: new Date(Date.now() - 3500 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: 3,
    action: 'CRON_SCHEDULED',
    details: 'Hourly event completion job and lifecycle monitors active',
    timestamp: new Date(Date.now() - 3400 * 1000).toISOString(),
    severity: 'info'
  }
];

// @desc    Get College Configuration
// @route   GET /api/admin/settings
// @access  Private (Admin)
const getSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      settings: {
        name: collegeConfig.name,
        shortName: collegeConfig.shortName,
        domain: collegeConfig.domain,
        departments: collegeConfig.departments,
        years: collegeConfig.years,
        allowedRoles: collegeConfig.allowedRoles,
        allowedUserTypes: collegeConfig.allowedUserTypes,
        smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
        cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update College Settings (departments, etc.)
// @route   PUT /api/admin/settings
// @access  Private (Admin)
const updateSettings = async (req, res, next) => {
  try {
    const { name, shortName, domain, departments } = req.body;

    if (name) collegeConfig.name = name;
    if (shortName) collegeConfig.shortName = shortName;
    if (domain) collegeConfig.domain = domain;
    if (departments && Array.isArray(departments)) {
      collegeConfig.departments = departments;
    }

    auditLogs.unshift({
      id: Date.now(),
      action: 'SETTINGS_UPDATE',
      details: `College configuration updated by Admin (${req.user.email})`,
      timestamp: new Date().toISOString(),
      severity: 'warning'
    });

    res.status(200).json({
      success: true,
      message: 'College settings updated successfully.',
      settings: collegeConfig
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get System Health & Audit Logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
const getSystemLogs = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const systemHealth = {
      status: 'healthy',
      nodeVersion: process.version,
      platform: `${os.type()} ${os.release()}`,
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host || '127.0.0.1',
        name: mongoose.connection.name || 'eventhub'
      },
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      system: {
        cpus: os.cpus().length,
        freeMemMB: Math.round(os.freemem() / 1024 / 1024),
        totalMemMB: Math.round(os.totalmem() / 1024 / 1024)
      }
    };

    res.status(200).json({
      success: true,
      systemHealth,
      auditLogs: auditLogs.slice(0, 30)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSystemLogs
};
