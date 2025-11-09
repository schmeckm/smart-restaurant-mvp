// backend/src/controllers/authController.js
// ==========================================
// 🔒 MULTI-TENANT SECURE AUTH CONTROLLER
// ==========================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Restaurant } = require('../models');

// 🔑 JWT Token Generator
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * ==========================================
 * 🟢 LOGIN
 * ==========================================
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Bitte E-Mail und Passwort eingeben'
      });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'isActive']
        }
      ]
    });

    if (!user) {
      console.warn('❌ Benutzer nicht gefunden:', email);
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Ihr Account wurde deaktiviert'
      });
    }

    if (!user.restaurant || !user.restaurant.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Ihr Restaurant ist nicht aktiv'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('❌ Passwort falsch');
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    const token = generateToken(user.id);

    console.log('✅ Login erfolgreich für:', user.email);

    res.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          uiLanguage: user.uiLanguage,
          restaurant: {
            id: user.restaurant.id,
            name: user.restaurant.name
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Login'
    });
  }
};

/**
 * ==========================================
 * 🔒 REGISTRIERUNG (Deaktiviert)
 * ==========================================
 */
exports.register = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Öffentliche Registrierung ist deaktiviert. Bitte kontaktieren Sie Ihren Administrator.'
  });
};

/**
 * ==========================================
 * 👤 PROFIL ABRUFEN
 * ==========================================
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Abrufen des Profils'
    });
  }
};

/**
 * ==========================================
 * ✏️ PROFIL AKTUALISIEREN
 * ==========================================
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, uiLanguage, phone } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'E-Mail wird bereits verwendet'
        });
      }
    }

    // ✏️ hier jetzt auch phone mit aufnehmen
    await user.update({
      name: name || user.name,
      email: email || user.email,
      uiLanguage: uiLanguage || user.uiLanguage,
      phone: phone || user.phone
    });

    // neu laden
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Profil erfolgreich aktualisiert',
      data: updatedUser
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Aktualisieren des Profils'
    });
  }
};
 
/**
 * ==========================================
 * 🔑 PASSWORT ÄNDERN
 * ==========================================
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Aktuelles und neues Passwort erforderlich'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Aktuelles Passwort ist falsch'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfehler beim Ändern des Passworts'
    });
  }
};

/**
 * ==========================================
 * 🌐 GOOGLE AUTH (Platzhalter)
 * ==========================================
 */
exports.googleAuth = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Google OAuth noch nicht implementiert'
  });
};

/**
 * ==========================================
 * 🚪 LOGOUT (Clientseitig)
 * ==========================================
 */
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Erfolgreich abgemeldet'
  });
};
