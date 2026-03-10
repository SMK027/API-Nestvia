const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/notifications — Notifications du compte connecté
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT n.id_notification, n.type, n.message, n.is_read, n.date_created,
             n.id_reservation
      FROM notifications n
      WHERE n.id_locataire = ?
      ORDER BY n.date_created DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PATCH /nestvia/notifications/:id/read — Marquer une notification comme lue
router.patch('/:id/read', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id_notification = ? AND id_locataire = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification introuvable' });
    }

    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
