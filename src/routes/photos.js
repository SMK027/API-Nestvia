const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/photos — Toutes les photos
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_photo, nom_photo, CONCAT(?, lien_photo) AS lien_photo, id_bien, date_upload FROM photo ORDER BY date_upload DESC',
      [process.env.APP_URL || 'https://nestvia.leofranz.fr']
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/photos/:id — Détail d'une photo
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_photo, nom_photo, CONCAT(?, lien_photo) AS lien_photo, id_bien, date_upload FROM photo WHERE id_photo = ?',
      [process.env.APP_URL || 'https://nestvia.leofranz.fr', req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Photo introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
