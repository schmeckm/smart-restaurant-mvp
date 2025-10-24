const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  googleAuth,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Protected routes
router.get('/me', protect, getProfile);           // ⬅️ DIESE ZEILE HINZUFÜGEN!
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;