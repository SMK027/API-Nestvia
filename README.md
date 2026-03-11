# Nestvia API

API REST pour la gestion de locations — accès utilisateur (locataire).

**URL de production** : `https://api.leofranz.fr/nestvia`

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
    ├── biens.js          # GET /biens (recherche), /biens/:id, blocages, photos, tarifs, avis
    ├── communes.js       # GET /communes, /communes/:id
    ├── compte.js         # GET|PUT /compte
    ├── favoris.js        # GET /favoris
    ├── notifications.js  # GET /notifications, PATCH /notifications/:id/read
    ├── photos.js         # GET /photos, /photos/:id
    ├── reservations.js   # GET|POST /reservations
    ├── tarifs.js         # GET /tarifs?id_bien=...
    └── types-bien.js     # GET /types-bien (recherche), /types-bien/:id
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
| GET | `/nestvia/biens` | Liste des biens (avec filtres de recherche, voir ci-dessous) |
| GET | `/nestvia/biens/:id` | Détail d'un bien + prestations |
| GET | `/nestvia/biens/:id/blocages` | Blocages du bien |
| GET | `/nestvia/biens/:id/photos` | Photos du bien (URLs complètes) |
| GET | `/nestvia/biens/:id/tarifs` | Tarifs du bien (optionnel: `?date_debut=&date_fin=`) |
| GET | `/nestvia/biens/:id/avis` | Avis validés du bien |
| POST | `/nestvia/biens/:id/avis` | Créer un avis (body: `id_reservation`, `rating` 1-5, `comment`) |

#### Filtres de recherche des biens

`GET /nestvia/biens` accepte les query params suivants, combinables :

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `nb_personnes` | Nombre minimum de couchages | `?nb_personnes=4` |
| `tarif_min` | Tarif semaine minimum (€) | `?tarif_min=100` |
| `tarif_max` | Tarif semaine maximum (€) | `?tarif_max=300` |
| `type_bien` | ID du type de bien | `?type_bien=2` |
| `animaux` | Animaux autorisés (`oui` / `non`) | `?animaux=oui` |
| `commune` | ID de la commune | `?commune=30438` |
| `prestations` | IDs des prestations requises (toutes doivent être présentes) | `?prestations=1,3,5` |

Exemple combiné : `GET /nestvia/biens?nb_personnes=4&animaux=oui&tarif_max=300`

### Communes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/communes` | Liste (filtres: `?search=&departement=&limit=`) |
| GET | `/nestvia/communes/:id` | Détail d'une commune |

Recherche par nom ou code postal : `GET /nestvia/communes?search=mont`

### Compte

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/compte` | Infos du compte connecté |
| PUT | `/nestvia/compte` | Mise à jour du compte (champs autorisés uniquement) |

Champs modifiables : `nom_locataire`, `prenom_locataire`, `dna_locataire`, `email_locataire`, `rue_locataire`, `tel_locataire`, `comp_locataire`, `id_commune`, `raison_sociale`, `siret`, `password`.

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
| GET | `/nestvia/photos` | Toutes les photos (URLs complètes) |
| GET | `/nestvia/photos/:id` | Détail d'une photo |

Les liens photos sont retournés en URL complète (préfixés par `APP_URL`).

### Réservations

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/reservations` | Réservations du compte connecté |
| GET | `/nestvia/reservations/:id` | Détail d'une réservation |
| POST | `/nestvia/reservations` | Créer une réservation (body: `date_debut`, `date_fin`, `id_bien`, `id_tarif`) |

Le montant total est calculé automatiquement (nombre de semaines × tarif).

### Tarifs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/tarifs?id_bien=X` | Tarifs d'un bien (optionnel: `&date_debut=&date_fin=`) |

### Types de bien

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/nestvia/types-bien` | Liste des types de bien (optionnel: `?search=`) |
| GET | `/nestvia/types-bien/:id` | Détail d'un type de bien |

Recherche par description : `GET /nestvia/types-bien?search=maison`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_HOST` | Hôte MariaDB | `mariadb-central` |
| `DB_PORT` | Port MariaDB | `3306` |
| `DB_USER` | Utilisateur BDD | `nestvia` |
| `DB_PASSWORD` | Mot de passe BDD | — |
| `DB_NAME` | Nom de la base | `nestvia` |
| `JWT_SECRET` | Clé secrète JWT | — |
| `JWT_EXPIRES_IN` | Durée de validité du token | `24h` |
| `PORT` | Port d'écoute de l'API | `4000` |
| `APP_URL` | URL de l'application (préfixe photos) | `https://nestvia.leofranz.fr` |

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

## Sécurité

- **Authentification JWT** sur tous les endpoints sauf login et tentatives
- **Rate limiting** : 20 requêtes / 15 min sur le login, 50 / 15 min sur les tentatives
- **Helmet** : headers de sécurité HTTP
- **Requêtes paramétrées** : protection contre les injections SQL
- **Whitelist des champs** : seuls les champs autorisés sont modifiables sur le compte
- **Trust proxy** : configuré pour fonctionner derrière Traefik

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
