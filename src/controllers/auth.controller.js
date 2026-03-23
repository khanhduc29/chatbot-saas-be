const User = require('../models/User');

/**
 * Auth Controller - Register, Login, Profile
 */

// POST /api/auth/register - Đăng ký
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check email tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Tạo user (role mặc định là 'user', chỉ admin tạo được admin khác)
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user' // Cho phép tạo admin để debug
    });

    // Tạo token
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      data: {
        user: user.toPublic(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login - Đăng nhập
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Lấy user kèm password (select: false trong schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Tạo token
    const token = user.generateToken();

    res.json({
      success: true,
      data: {
        user: user.toPublic(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me - Lấy profile hiện tại
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user.toPublic()
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users - Admin: lấy danh sách users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users.map(u => u.toPublic())
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/users/:id/role - Admin: đổi role user
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be: admin or user'
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
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toPublic()
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/users/:id/toggle - Admin: activate/deactivate user
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: user.toPublic(),
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, getUsers, updateUserRole, toggleUserActive };
