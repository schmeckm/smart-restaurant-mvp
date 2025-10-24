// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Bitte E-Mail und Passwort eingeben'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    console.log('🔍 User found, checking password...');
    console.log('🔍 Stored password:', user.password ? 'EXISTS' : 'NULL');
    console.log('🔍 Input password:', password);

    // Check if password exists
    if (!user.password) {
      console.log('❌ No password stored for user');
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Check password - handle both hashed and plain text passwords
    let isMatch = false;
    
    // Check if password is already hashed (starts with $2a$ or $2b$)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('🔍 Comparing with hashed password...');
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      console.log('🔍 Comparing with plain text password...');
      // For plain text passwords (temporary fallback)
      isMatch = password === user.password;
      
      // If plain text match, hash it and update
      if (isMatch) {
        console.log('🔄 Updating plain text password to hashed...');
        const hashedPassword = await bcrypt.hash(password, 10);
        await user.update({ password: hashedPassword });
      }
    }
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Generate token
    const token = generateToken(user.id);
    
    console.log('✅ Login successful:', user.email);

    res.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body);
    
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'E-Mail, Passwort und Name sind erforderlich'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Benutzer existiert bereits'
      });
    }

    // Validate and set role
    const validRoles = ['admin', 'manager', 'employee'];
    let userRole = 'employee'; // default
    
    if (role && validRoles.includes(role)) {
      userRole = role;
    }

    console.log('🔐 Hashing password...');
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('💾 Creating user with role:', userRole);
    
    // Create user
    const user = await User.create({ 
      email, 
      password: hashedPassword,
      name, 
      role: userRole
    });
    
    // Generate token
    const token = generateToken(user.id);

    console.log('✅ User created successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      data: { 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role
        } 
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Serverfehler bei der Registrierung',
      error: error.message 
    });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Serverfehler' });
  }
};

// Stub functions
exports.updateProfile = async (req, res) => {
  res.json({ success: true, message: 'Not implemented yet' });
};

exports.changePassword = async (req, res) => {
  res.json({ success: true, message: 'Not implemented yet' });
};

exports.googleAuth = async (req, res) => {
  res.json({ success: true, message: 'Google OAuth not implemented yet' });
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Erfolgreich abgemeldet' });
};