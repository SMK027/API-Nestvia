const express = require('express');
const authenticate = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

// GET /nestvia/biens — Liste de tous les biens
// Query params optionnels : nb_personnes, tarif_max, tarif_min, type_bien, animaux, commune, prestations (ids séparés par virgule)
router.get('/', async (req, res) => {
  try {
    const { nb_personnes, tarif_max, tarif_min, type_bien, animaux, commune, prestations } = req.query;

    const conditions = [];
    const params = [];
    const joins = [];

    if (nb_personnes) {
      conditions.push('CAST(b.nb_couchage AS UNSIGNED) >= ?');
      params.push(parseInt(nb_personnes, 10));
    }

    if (type_bien) {
      conditions.push('b.id_typebien = ?');
      params.push(parseInt(type_bien, 10));
    }

    if (animaux) {
      conditions.push('b.animaux_bien = ?');
      params.push(animaux.toLowerCase() === 'oui' ? 'Oui' : 'Non');
    }

    if (commune) {
      conditions.push('b.id_commune = ?');
      params.push(parseInt(commune, 10));
    }

    if (tarif_min || tarif_max) {
      joins.push('INNER JOIN tarif t_filtre ON t_filtre.id_bien = b.id_bien');
      if (tarif_min) {
        conditions.push('CAST(t_filtre.tarif AS DECIMAL(10,2)) >= ?');
        params.push(parseFloat(tarif_min));
      }
      if (tarif_max) {
        conditions.push('CAST(t_filtre.tarif AS DECIMAL(10,2)) <= ?');
        params.push(parseFloat(tarif_max));
      }
    }

    if (prestations) {
      const ids = prestations.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        joins.push(`INNER JOIN secompose sc_filtre ON sc_filtre.id_bien = b.id_bien AND sc_filtre.id_prestation IN (${placeholders})`);
        params.push(...ids);
        conditions.push('1=1 GROUP BY b.id_bien HAVING COUNT(DISTINCT sc_filtre.id_prestation) = ?');
        params.push(ids.length);
      }
    }

    let query = `
      SELECT DISTINCT b.*, tb.des_typebien, c.nom_commune, c.cp_commune
      FROM bien b
      LEFT JOIN type_bien tb ON b.id_typebien = tb.id_typebien
      LEFT JOIN commune c ON b.id_commune = c.id_commune
      ${joins.join('\n      ')}
    `;

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Si prestations avec GROUP BY, ne pas ajouter de ORDER BY avant
    if (!prestations) {
      query += ' ORDER BY b.nom_bien';
    }

    const [rows] = await pool.execute(query, params);
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
      'SELECT id_photo, nom_photo, CONCAT(?, lien_photo) AS lien_photo, date_upload FROM photo WHERE id_bien = ? ORDER BY date_upload',
      [process.env.APP_URL || 'https://nestvia.leofranz.fr', req.params.id]
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

// GET /nestvia/biens/:id/avis — Avis validés d'un bien
router.get('/:id/avis', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.id_review, r.rating, r.comment, r.date_created,
             l.prenom_locataire, l.nom_locataire
      FROM reviews r
      JOIN locataire l ON r.id_locataire = l.id_locataire
      WHERE r.id_bien = ? AND r.is_validated = 1
      ORDER BY r.date_created DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /nestvia/biens/:id/avis — Créer un avis pour un bien
router.post('/:id/avis', async (req, res) => {
  try {
    const { id_reservation, rating, comment } = req.body;
    const id_bien = req.params.id;

    if (!id_reservation || !rating) {
      return res.status(400).json({ error: 'Champs requis : id_reservation, rating' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Le rating doit être entre 1 et 5' });
    }

    // Vérifier que la réservation appartient au user et concerne ce bien
    const [reservations] = await pool.execute(
      'SELECT id_reservations FROM reservation WHERE id_reservations = ? AND id_locataire = ? AND id_bien = ?',
      [id_reservation, req.user.id, id_bien]
    );
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation introuvable pour ce bien et ce compte' });
    }

    // Vérifier qu'il n'y a pas déjà un avis pour cette réservation
    const [existing] = await pool.execute(
      'SELECT id_review FROM reviews WHERE id_reservation = ? AND id_locataire = ?',
      [id_reservation, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Un avis existe déjà pour cette réservation' });
    }

    const [result] = await pool.execute(`
      INSERT INTO reviews (id_locataire, id_bien, id_reservation, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, id_bien, id_reservation, ratingNum, comment || null]);

    res.status(201).json({
      id_review: result.insertId,
      id_bien: parseInt(id_bien, 10),
      id_reservation: parseInt(id_reservation, 10),
      rating: ratingNum,
      comment: comment || null,
      is_validated: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
