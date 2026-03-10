const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/favoris — Favoris du compte connecté
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.id_favori, f.date_ajout,
             b.id_bien, b.nom_bien, b.rue_bien, b.com_bien,
             b.superficie_bien, b.description_bien, b.nb_couchage,
             b.latitude, b.longitude,
             tb.des_typebien, c.nom_commune, c.cp_commune
      FROM favoris f
      JOIN bien b ON f.id_bien = b.id_bien
      LEFT JOIN type_bien tb ON b.id_typebien = tb.id_typebien
      LEFT JOIN commune c ON b.id_commune = c.id_commune
      WHERE f.id_locataire = ?
      ORDER BY f.date_ajout DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
