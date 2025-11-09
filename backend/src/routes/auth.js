// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  googleAuth,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: |
 *     Benutzer-Authentifizierung, Google OAuth und Profilverwaltung.
 *     Diese Routen ermöglichen Registrierung, Login, Profilabruf und Logout.
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Benutzer registrieren
 *     description: |
 *       Erstellt ein neues Benutzerkonto (Standardrolle: User).  
 *       Sendet zusätzlich eine Bestätigungs-E-Mail, sofern aktiviert.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "markus@example.com"
 *               password:
 *                 type: string
 *                 example: "MySecurePassword123"
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert
 *       400:
 *         description: Benutzer existiert bereits
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Benutzer einloggen
 *     description: |
 *       Authentifiziert einen Benutzer mit E-Mail und Passwort und gibt ein JWT zurück.  
 *       Dieses JWT wird für den Zugriff auf geschützte Routen benötigt.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@restaurant.com"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Erfolgreich eingeloggt
 *       401:
 *         description: Ungültige Zugangsdaten
 */

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Aktuelles Benutzerprofil abrufen
 *     description: Gibt das aktuell eingeloggte Benutzerprofil zurück.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Benutzerprofil zurückgegeben
 *       401:
 *         description: Nicht autorisiert
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Benutzer ausloggen
 *     description: Beendet die Sitzung des Benutzers und löscht das JWT-Token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich ausgeloggt
 *       401:
 *         description: Nicht autorisiert
 */

// ===============================
// 🟢 Öffentliche Routen
// ===============================
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// ===============================
// 🔒 Geschützte Routen
// ===============================
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
