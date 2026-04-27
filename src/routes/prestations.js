const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/prestations — Liste de toutes les prestations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_prestation, libelle_prestation FROM prestation ORDER BY libelle_prestation'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
