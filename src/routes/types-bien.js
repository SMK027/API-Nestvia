const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/types-bien — Liste des types de bien (avec recherche)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id_typebien, des_typebien FROM type_bien';
    const params = [];

    if (search) {
      query += ' WHERE des_typebien LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY des_typebien';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/types-bien/:id — Détail d'un type de bien
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_typebien, des_typebien FROM type_bien WHERE id_typebien = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Type de bien introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
