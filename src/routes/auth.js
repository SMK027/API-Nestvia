const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard' },
});

// POST /nestvia/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM locataire WHERE email_locataire = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = rows[0];
    // PHP bcrypt utilise $2y$, Node.js bcrypt attend $2b$ (compatible)
    const hash = user.pass_locataire.replace(/^\$2y\$/, '$2b$');
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user.id_locataire, email: user.email_locataire },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
