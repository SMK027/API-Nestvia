const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/tarifs — Tarifs (filtrable par bien et période)
// Query params: id_bien (requis), date_debut, date_fin
router.get('/', async (req, res) => {
  try {
    const { id_bien, date_debut, date_fin } = req.query;

    if (!id_bien) {
      return res.status(400).json({ error: 'Paramètre id_bien requis' });
    }

    let query = `
      SELECT t.*, s.libelle_saison
      FROM tarif t
      LEFT JOIN saison s ON t.id_saison = s.id_saison
      WHERE t.id_bien = ?
    `;
    const params = [id_bien];

    if (date_debut && date_fin) {
      const start = new Date(date_debut);
      const end = new Date(date_fin);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Format de date invalide (attendu: YYYY-MM-DD)' });
      }

      query += ' AND t.annee_tarif >= ? AND t.annee_tarif <= ?';
      params.push(start.getFullYear().toString(), end.getFullYear().toString());
    }

    query += ' ORDER BY t.annee_tarif, t.semaine_tarif';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
