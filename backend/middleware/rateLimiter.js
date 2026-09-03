const rateLimit = require('express-rate-limit');

// Limits repeated login/signup attempts from the same IP to stop
// brute-force password guessing and signup spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute ka window
  max: 10, // is window mein ek IP se sirf 10 requests allowed
  standardHeaders: true, // RateLimit-* headers response mein bhejo
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' }
});

module.exports = { authLimiter };
