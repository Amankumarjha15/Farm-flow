const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('../validators/authValidators');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Tighter rate limit on auth endpoints to slow brute-force / credential-stuffing attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, registerRules, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', authLimiter, loginRules, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', authLimiter, forgotPasswordRules, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
