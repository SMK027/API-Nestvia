# Nestvia API

API REST pour la gestion de locations — accès utilisateur (locataire).

## Architecture

```
src/
├── index.js              # Point d'entrée Express
├── config/
│   └── database.js       # Pool de connexion MariaDB
├── middleware/
│   └── auth.js           # Middleware JWT
└── routes/
    ├── auth.js           # POST /login
    ├── tentatives.js     # POST /tentatives (public)
    ├── biens.js          # GET /biens, /biens/:id, /biens/:id/blocages, photos, tarifs
    ├── communes.js       # GET /communes, /communes/:id
    ├── compte.js         # GET|PUT /compte
    ├── favoris.js        # GET /favoris
    ├── notifications.js  # GET /notifications, PATCH /notifications/:id/read
    ├── photos.js         # GET /photos, /photos/:id
    ├── reservations.js   # GET|POST /reservations
    └── tarifs.js         # GET /tarifs?id_bien=...
```

## Endpoints

Tous les endpoints sont préfixés par `/nestvia`. Tous requièrent un JWT sauf mention contraire.

### Authentification

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/nestvia/auth/login` | Non | Connexion (email + password) → JWT |
| POST | `/nestvia/tentatives` | Non | Log de tentative de connexion |

### Biens

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/biens` | Liste de tous les biens |
| GET | `/nestvia/biens/:id` | Détail d'un bien + prestations |
| GET | `/nestvia/biens/:id/blocages` | Blocages du bien |
| GET | `/nestvia/biens/:id/photos` | Photos du bien |
| GET | `/nestvia/biens/:id/tarifs` | Tarifs du bien (optionnel: `?date_debut=&date_fin=`) |

### Communes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/communes` | Liste (filtres: `?search=&departement=&limit=`) |
| GET | `/nestvia/communes/:id` | Détail d'une commune |

### Compte

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/compte` | Infos du compte connecté |
| PUT | `/nestvia/compte` | Mise à jour du compte |

### Favoris

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/favoris` | Favoris du compte connecté |

### Notifications

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/notifications` | Notifications du compte connecté |
| PATCH | `/nestvia/notifications/:id/read` | Marquer comme lue |

### Photos

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/photos` | Toutes les photos |
| GET | `/nestvia/photos/:id` | Détail d'une photo |

### Réservations

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/reservations` | Réservations du compte connecté |
| GET | `/nestvia/reservations/:id` | Détail d'une réservation |
| POST | `/nestvia/reservations` | Créer une réservation |

### Tarifs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/tarifs?id_bien=X` | Tarifs d'un bien (optionnel: `&date_debut=&date_fin=`) |

## Déploiement

### 1. Configuration

```bash
cp .env.example .env
# Éditer .env avec les vraies valeurs
```

### 2. Lancement

```bash
docker compose up -d --build
```

Le conteneur se connecte automatiquement aux réseaux `proxy` (Traefik) et `db_internal` (MariaDB centralisée).

### 3. Vérification

```bash
curl https://api.leofranz.fr/nestvia/health
```

## Authentification

L'API utilise des JWT (JSON Web Tokens). Pour obtenir un token :

```bash
curl -X POST https://api.leofranz.fr/nestvia/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

Réponse : `{ "token": "eyJ..." }`

Utilisation dans les requêtes suivantes :

```bash
curl https://api.leofranz.fr/nestvia/biens \
  -H "Authorization: Bearer eyJ..."
```
