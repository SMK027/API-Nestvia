const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/biens — Liste de tous les biens
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.*, tb.des_typebien, c.nom_commune, c.cp_commune
      FROM bien b
      LEFT JOIN type_bien tb ON b.id_typebien = tb.id_typebien
      LEFT JOIN commune c ON b.id_commune = c.id_commune
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/biens/:id — Détail d'un bien
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.*, tb.des_typebien, c.nom_commune, c.cp_commune
      FROM bien b
      LEFT JOIN type_bien tb ON b.id_typebien = tb.id_typebien
      LEFT JOIN commune c ON b.id_commune = c.id_commune
      WHERE b.id_bien = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bien introuvable' });
    }

    // Récupérer les prestations du bien
    const [prestations] = await pool.execute(`
      SELECT p.id_prestation, p.libelle_prestation, sc.quantite
      FROM secompose sc
      JOIN prestation p ON sc.id_prestation = p.id_prestation
      WHERE sc.id_bien = ?
    `, [req.params.id]);

    res.json({ ...rows[0], prestations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/biens/:id/blocages — Blocages d'un bien
router.get('/:id/blocages', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_blocage, date_debut, date_fin, motif, date_creation FROM blocage WHERE id_bien = ? ORDER BY date_debut',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/biens/:id/photos — Photos d'un bien
router.get('/:id/photos', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_photo, nom_photo, lien_photo, date_upload FROM photo WHERE id_bien = ? ORDER BY date_upload',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/biens/:id/tarifs — Tarifs d'un bien (optionnel: ?date_debut=YYYY-MM-DD&date_fin=YYYY-MM-DD)
router.get('/:id/tarifs', async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;

    if (date_debut && date_fin) {
      // Calculer les numéros de semaine pour la période
      const start = new Date(date_debut);
      const end = new Date(date_fin);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Format de date invalide (attendu: YYYY-MM-DD)' });
      }

      const [rows] = await pool.execute(`
        SELECT t.*, s.libelle_saison
        FROM tarif t
        LEFT JOIN saison s ON t.id_saison = s.id_saison
        WHERE t.id_bien = ?
          AND t.annee_tarif >= ?
          AND t.annee_tarif <= ?
        ORDER BY t.annee_tarif, t.semaine_tarif
      `, [req.params.id, start.getFullYear().toString(), end.getFullYear().toString()]);

      // Filtrer par semaines dans la période
      const startWeek = getWeekNumber(start);
      const endWeek = getWeekNumber(end);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      const filtered = rows.filter(r => {
        const week = parseInt(r.semaine_tarif, 10);
        const year = parseInt(r.annee_tarif, 10);
        if (startYear === endYear) {
          return year === startYear && week >= startWeek && week <= endWeek;
        }
        if (year === startYear) return week >= startWeek;
        if (year === endYear) return week <= endWeek;
        return year > startYear && year < endYear;
      });

      return res.json(filtered);
    }

    const [rows] = await pool.execute(`
      SELECT t.*, s.libelle_saison
      FROM tarif t
      LEFT JOIN saison s ON t.id_saison = s.id_saison
      WHERE t.id_bien = ?
      ORDER BY t.annee_tarif, t.semaine_tarif
    `, [req.params.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

module.exports = router;
