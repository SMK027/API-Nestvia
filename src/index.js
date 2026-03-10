require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const tentativesRoutes = require('./routes/tentatives');
const biensRoutes = require('./routes/biens');
const communesRoutes = require('./routes/communes');
const compteRoutes = require('./routes/compte');
const favorisRoutes = require('./routes/favoris');
const notificationsRoutes = require('./routes/notifications');
const photosRoutes = require('./routes/photos');
const reservationsRoutes = require('./routes/reservations');
const tarifsRoutes = require('./routes/tarifs');

const app = express();
const PORT = process.env.PORT || 3000;
const PREFIX = '/nestvia';

// Derrière Traefik (reverse proxy)
app.set('trust proxy', 1);

// Sécurité et parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes publiques
app.use(`${PREFIX}/auth`, authRoutes);
app.use(`${PREFIX}/tentatives`, tentativesRoutes);

// Routes protégées (l'auth est appliquée dans chaque routeur)
app.use(`${PREFIX}/biens`, biensRoutes);
app.use(`${PREFIX}/communes`, communesRoutes);
app.use(`${PREFIX}/compte`, compteRoutes);
app.use(`${PREFIX}/favoris`, favorisRoutes);
app.use(`${PREFIX}/notifications`, notificationsRoutes);
app.use(`${PREFIX}/photos`, photosRoutes);
app.use(`${PREFIX}/reservations`, reservationsRoutes);
app.use(`${PREFIX}/tarifs`, tarifsRoutes);

// Health check
app.get(`${PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// Gestion d'erreurs globale
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nestvia API démarrée sur le port ${PORT}`);
});
