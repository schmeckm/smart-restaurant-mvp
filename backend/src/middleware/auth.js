const jwt = require('jsonwebtoken');
const { User, Restaurant } = require('../models');

/**
 * ==========================================
 * 🔐 PROTECT MIDDLEWARE
 * ==========================================
 * Prüft JWT-Token, hängt Benutzer (mit Restaurant) an req.user
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Token aus Authorization-Header lesen
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Nicht autorisiert – Kein Token vorhanden'
      });
    }

    // Token validieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Benutzer abrufen
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'restaurantId', 'uiLanguage', 'isActive'],
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'isActive']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Deaktivierte Benutzer blockieren
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Benutzer ist deaktiviert'
      });
    }

    // Restaurant prüfen
    if (!user.restaurant || !user.restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Das zugehörige Restaurant ist deaktiviert'
      });
    }

    // Benutzer in Request-Objekt speichern
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      uiLanguage: user.uiLanguage,
      restaurantName: user.restaurant.name
    };

    next();
  } catch (error) {
    console.error('❌ Auth Middleware Fehler:', error);

    // Differenziertes Error-Handling
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token abgelaufen. Bitte neu anmelden.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Ungültiger Token.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Serverfehler in der Authentifizierung'
    });
  }
};

/**
 * ==========================================
 * 🛡️ AUTHORIZE MIDDLEWARE
 * ==========================================
 * Zugriff nur für bestimmte Rollen (Admin, Manager, etc.)
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Nicht authentifiziert'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rolle '${req.user.role}' ist nicht autorisiert für diese Aktion`
      });
    }

    next();
  };
};
