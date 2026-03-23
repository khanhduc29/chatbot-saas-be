const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers, updateUserRole, toggleUserActive } = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateRequired } = require('../middleware/validateRequest');

// Public routes
router.post('/register', validateRequired(['name', 'email', 'password']), register);
router.post('/login', validateRequired(['email', 'password']), login);

// Protected routes
router.get('/me', protect, getMe);

// Admin routes
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/users/:id/toggle', protect, authorize('admin'), toggleUserActive);

module.exports = router;
