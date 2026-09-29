const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

// @desc    Get aggregate college analytics and trends
// @route   GET /api/analytics/overview
// @access  Private (HOD, Principal, Admin, Organizer)
const getAnalyticsOverview = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const totalEvents = await Event.countDocuments();
    const approvedEvents = await Event.countDocuments({ status: 'approved' });
    const pendingApprovals = await Event.countDocuments({
      status: { $in: ['pending_hod', 'pending_principal'] }
    });
    const totalRegistrations = await Registration.countDocuments();
    const totalCheckedIn = await Registration.countDocuments({ checkedIn: true });
    const totalCertificates = await Certificate.countDocuments();
    const totalUsers = await User.countDocuments();

    // 2. Department Breakdown
    const departmentStats = await Event.aggregate([
      {
        $group: {
          _id: '$department',
          eventsCount: { $sum: 1 },
          registrations: { $sum: '$registeredCount' },
          capacity: { $sum: '$capacity' }
        }
      },
      { $sort: { registrations: -1 } }
    ]);

    // 3. Category Breakdown
    const categoryStats = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          registrations: { $sum: '$registeredCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 4. Monthly Trend Data (Simulated realistic curve based on active college calendar)
    const monthlyTrends = [
      { month: 'Jun', events: 3, registrations: 180, attendance: 160 },
      { month: 'Jul', events: 5, registrations: 340, attendance: 310 },
      { month: 'Aug', events: 8, registrations: 620, attendance: 580 },
      { month: 'Sep', events: 12, registrations: 950, attendance: 890 },
      { month: 'Oct', events: 14, registrations: 1200, attendance: 1120 },
      { month: 'Nov', events: 9, registrations: 780, attendance: 710 }
    ];

    res.status(200).json({
      success: true,
      kpis: {
        totalEvents,
        approvedEvents,
        pendingApprovals,
        totalRegistrations,
        totalCheckedIn,
        attendanceRate:
          totalRegistrations > 0
            ? Math.round((totalCheckedIn / totalRegistrations) * 100)
            : 0,
        totalCertificates,
        totalUsers
      },
      departmentStats: departmentStats.map((d) => ({
        department: d._id,
        events: d.eventsCount,
        registrations: d.registrations,
        capacity: d.capacity
      })),
      categoryStats: categoryStats.map((c) => ({
        category: c._id,
        count: c.count,
        registrations: c.registrations
      })),
      monthlyTrends
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview
};
