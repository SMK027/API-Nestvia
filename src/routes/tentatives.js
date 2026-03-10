const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');

const router = express.Router();

const tentativeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
});

// POST /nestvia/tentatives — Public (pas d'auth)
router.post('/', tentativeLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    await pool.execute(
      'INSERT INTO tentatives_connexion (email_tentative, date_tentative, ip_address) VALUES (?, NOW(), ?)',
      [email, ip]
    );

    res.status(201).json({ message: 'Tentative enregistrée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
