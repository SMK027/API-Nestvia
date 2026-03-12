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

// POST /nestvia/favoris — Ajouter un bien aux favoris
router.post('/', async (req, res) => {
  try {
    const { id_bien } = req.body;

    if (!id_bien) {
      return res.status(400).json({ error: 'Champ requis : id_bien' });
    }

    // Vérifier que le bien existe
    const [biens] = await pool.execute('SELECT id_bien FROM bien WHERE id_bien = ?', [id_bien]);
    if (biens.length === 0) {
      return res.status(404).json({ error: 'Bien introuvable' });
    }

    // Vérifier qu'il n'est pas déjà en favori
    const [existing] = await pool.execute(
      'SELECT id_favori FROM favoris WHERE id_locataire = ? AND id_bien = ?',
      [req.user.id, id_bien]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ce bien est déjà dans vos favoris' });
    }

    const [result] = await pool.execute(
      'INSERT INTO favoris (id_locataire, id_bien) VALUES (?, ?)',
      [req.user.id, id_bien]
    );

    res.status(201).json({
      id_favori: result.insertId,
      id_bien: parseInt(id_bien, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /nestvia/favoris/:id — Supprimer un favori
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_favori FROM favoris WHERE id_favori = ? AND id_locataire = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Favori introuvable' });
    }

    await pool.execute('DELETE FROM favoris WHERE id_favori = ? AND id_locataire = ?', [req.params.id, req.user.id]);

    res.json({ message: 'Favori supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
