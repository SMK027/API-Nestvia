const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/communes — Liste des communes
router.get('/', async (req, res) => {
  try {
    const { search, departement, limit } = req.query;
    let query = 'SELECT id_commune, nom_commune, cp_commune, commune_departement, code_commune, commune_longitude_deg, commune_latitude_deg FROM commune';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(nom_commune LIKE ? OR cp_commune LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (departement) {
      conditions.push('commune_departement = ?');
      params.push(departement);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY nom_commune';

    const maxLimit = Math.min(parseInt(limit, 10) || 100, 500);
    query += ' LIMIT ?';
    params.push(maxLimit);

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/communes/:id — Détail d'une commune
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM commune WHERE id_commune = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Commune introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
