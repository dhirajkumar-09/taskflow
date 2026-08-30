const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

// Get current user's profile
router.get('/profile', protect, getProfile);

// Update current user's profile (name, college, department)
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('college').optional().trim(),
    body('department').optional().trim()
  ],
  updateProfile
);

module.exports = router;