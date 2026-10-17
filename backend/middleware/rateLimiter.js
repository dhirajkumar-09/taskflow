const rateLimit = require('express-rate-limit');

// Limits repeated login/signup attempts from the same IP to stop
// brute-force password guessing and signup spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 1000, // High limit for local development & testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' }
});

module.exports = { authLimiter };
