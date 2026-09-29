const User = require('../models/User');

// @desc    Get all users with search & filters
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, department, userType, search, limit = 50, page = 1 } = req.query;

    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (userType && userType !== 'All') {
      query.userType = userType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { collegeName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role
// @route   PATCH /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowed = ['student', 'organizer', 'hod', 'principal', 'admin'];

    if (!allowed.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed values: ${allowed.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role successfully updated to '${role}'.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active/deactivated state
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserStatus
};
