const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/reservations — Réservations du compte connecté
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.id_reservations, r.date_debut, r.date_fin, r.montant_total,
             b.id_bien, b.nom_bien, b.rue_bien, b.com_bien,
             t.tarif, t.semaine_tarif, t.annee_tarif,
             s.libelle_saison
      FROM reservation r
      JOIN bien b ON r.id_bien = b.id_bien
      LEFT JOIN tarif t ON r.id_tarif = t.id_tarif
      LEFT JOIN saison s ON t.id_saison = s.id_saison
      WHERE r.id_locataire = ?
      ORDER BY r.date_debut DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /nestvia/reservations/:id — Détail d'une réservation du compte connecté
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.id_reservations, r.date_debut, r.date_fin, r.montant_total,
             b.id_bien, b.nom_bien, b.rue_bien, b.com_bien,
             b.description_bien, b.nb_couchage,
             t.tarif, t.semaine_tarif, t.annee_tarif,
             s.libelle_saison
      FROM reservation r
      JOIN bien b ON r.id_bien = b.id_bien
      LEFT JOIN tarif t ON r.id_tarif = t.id_tarif
      LEFT JOIN saison s ON t.id_saison = s.id_saison
      WHERE r.id_reservations = ? AND r.id_locataire = ?
    `, [req.params.id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Réservation introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /nestvia/reservations — Créer une réservation pour le compte connecté
router.post('/', async (req, res) => {
  try {
    const { date_debut, date_fin, id_bien, id_tarif } = req.body;

    if (!date_debut || !date_fin || !id_bien || !id_tarif) {
      return res.status(400).json({ error: 'Champs requis : date_debut, date_fin, id_bien, id_tarif' });
    }

    const start = new Date(date_debut);
    const end = new Date(date_fin);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Format de date invalide (attendu: YYYY-MM-DD)' });
    }
    if (start >= end) {
      return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
    }

    // Vérifier que le bien existe
    const [biens] = await pool.execute('SELECT id_bien FROM bien WHERE id_bien = ?', [id_bien]);
    if (biens.length === 0) {
      return res.status(404).json({ error: 'Bien introuvable' });
    }

    // Vérifier qu'il n'y a pas de blocage sur la période
    const [blocages] = await pool.execute(`
      SELECT id_blocage FROM blocage
      WHERE id_bien = ? AND date_debut < ? AND date_fin > ?
    `, [id_bien, date_fin, date_debut]);

    if (blocages.length > 0) {
      return res.status(409).json({ error: 'Le bien est bloqué sur cette période' });
    }

    // Vérifier qu'il n'y a pas de réservation existante sur la période
    const [existing] = await pool.execute(`
      SELECT id_reservations FROM reservation
      WHERE id_bien = ? AND date_debut < ? AND date_fin > ?
    `, [id_bien, date_fin, date_debut]);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Le bien est déjà réservé sur cette période' });
    }

    // Vérifier que le tarif existe et correspond au bien
    const [tarifs] = await pool.execute(
      'SELECT id_tarif, tarif FROM tarif WHERE id_tarif = ? AND id_bien = ?',
      [id_tarif, id_bien]
    );
    if (tarifs.length === 0) {
      return res.status(404).json({ error: 'Tarif introuvable pour ce bien' });
    }

    // Calculer le montant total (nombre de semaines × tarif)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, Math.ceil(diffDays / 7));
    const prixSemaine = parseFloat(tarifs[0].tarif) || 0;
    const montantTotal = (weeks * prixSemaine).toFixed(2);

    const [result] = await pool.execute(`
      INSERT INTO reservation (date_debut, date_fin, id_locataire, id_bien, id_tarif, montant_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [date_debut, date_fin, req.user.id, id_bien, id_tarif, montantTotal]);

    res.status(201).json({
      id_reservations: result.insertId,
      date_debut,
      date_fin,
      id_bien: parseInt(id_bien, 10),
      id_tarif: parseInt(id_tarif, 10),
      montant_total: parseFloat(montantTotal),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
