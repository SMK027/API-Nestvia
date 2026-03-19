const express = require('express');
const bcrypt = require('bcrypt');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/compte — Infos du compte connecté
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id_locataire, nom_locataire, prenom_locataire, dna_locataire,
             email_locataire, rue_locataire, tel_locataire, comp_locataire,
             id_commune, raison_sociale, siret
      FROM locataire WHERE id_locataire = ?
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /nestvia/compte — Mise à jour du compte connecté
router.put('/', async (req, res) => {
  try {
    const allowedFields = [
      'nom_locataire', 'prenom_locataire', 'dna_locataire',
      'email_locataire', 'rue_locataire', 'tel_locataire',
      'comp_locataire', 'id_commune', 'raison_sociale', 'siret'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    // Gestion du mot de passe : utiliser PUT /compte/password

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    params.push(req.user.id);

    await pool.execute(
      `UPDATE locataire SET ${updates.join(', ')} WHERE id_locataire = ?`,
      params
    );

    // Retourner les infos mises à jour
    const [rows] = await pool.execute(`
      SELECT id_locataire, nom_locataire, prenom_locataire, dna_locataire,
             email_locataire, rue_locataire, tel_locataire, comp_locataire,
             id_commune, raison_sociale, siret
      FROM locataire WHERE id_locataire = ?
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /nestvia/compte/password — Modifier le mot de passe
router.put('/password', async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'Champs requis : current_password, new_password, confirm_password' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Le nouveau mot de passe et sa confirmation ne correspondent pas' });
    }

    // Récupérer le hash actuel
    const [rows] = await pool.execute(
      'SELECT pass_locataire FROM locataire WHERE id_locataire = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    // Compatibilité PHP bcrypt $2y$ → $2b$
    const hash = rows[0].pass_locataire.replace(/^\$2y\$/, '$2b$');
    const valid = await bcrypt.compare(current_password, hash);
    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher et enregistrer le nouveau mot de passe
    const newHash = await bcrypt.hash(new_password, 12);
    await pool.execute(
      'UPDATE locataire SET pass_locataire = ? WHERE id_locataire = ?',
      [newHash, req.user.id]
    );

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
