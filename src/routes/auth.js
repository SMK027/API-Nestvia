const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');

const router = express.Router();

const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 30;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard' },
});

// Génère un refresh token et l'insère en base
async function generateRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await pool.execute(
    'INSERT INTO refresh_token (id_locataire, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );

  return { token, expires_at: expiresAt };
}

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

    const refresh = await generateRefreshToken(user.id_locataire);

    res.json({
      token,
      refresh_token: refresh.token,
      refresh_expires_at: refresh.expires_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /nestvia/auth/refresh — Regénérer un JWT à partir d'un refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Champ requis : refresh_token' });
    }

    // Récupérer le refresh token en base
    const [rows] = await pool.execute(
      'SELECT rt.*, l.email_locataire FROM refresh_token rt JOIN locataire l ON rt.id_locataire = l.id_locataire WHERE rt.token = ?',
      [refresh_token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token invalide' });
    }

    const stored = rows[0];

    // Vérifier l'expiration
    if (new Date(stored.expires_at) < new Date()) {
      // Supprimer le token expiré
      await pool.execute('DELETE FROM refresh_token WHERE id_refresh = ?', [stored.id_refresh]);
      return res.status(401).json({ error: 'Refresh token expiré' });
    }

    // Supprimer l'ancien refresh token (rotation)
    await pool.execute('DELETE FROM refresh_token WHERE id_refresh = ?', [stored.id_refresh]);

    // Générer un nouveau JWT
    const token = jwt.sign(
      { id: stored.id_locataire, email: stored.email_locataire },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Générer un nouveau refresh token (rotation)
    const refresh = await generateRefreshToken(stored.id_locataire);

    res.json({
      token,
      refresh_token: refresh.token,
      refresh_expires_at: refresh.expires_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
