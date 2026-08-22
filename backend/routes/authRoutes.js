const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { signup } = require('../controllers/authController');

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  signup
);

module.exports = router;