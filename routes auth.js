const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Register new user
router.post('/register', [
  check('email', 'Valid email is required').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('phoneNumber', 'Valid phone number is required').isLength({ min: 10 }),
  check('ecocashNumber', 'Valid EcoCash number is required').isLength({ min: 10 })
], authController.register);

// Login user
router.post('/login', [
  check('email', 'Valid email is required').isEmail(),
  check('password', 'Password is required').exists()
], authController.login);

// Get current user
router.get('/me', auth, authController.getMe);

// Update user profile
router.put('/profile', auth, authController.updateProfile);

// Change password
router.put('/change-password', auth, [
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], authController.changePassword);

// Forgot password
router.post('/forgot-password', [
  check('email', 'Valid email is required').isEmail()
], authController.forgotPassword);

// Reset password
router.post('/reset-password', [
  check('token', 'Token is required').exists(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], authController.resetPassword);

module.exports = router;
