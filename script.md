Je souhaite créer une API pour gérer la base de données que voici (fichier dump.sql).
L'API permettra d'accéder aux fonctionnalités utilisateur uniquement:
- Consultation des biens
- Consultation des blocages pour chaque bien
- Consultation des communes enregistrées
- Consultation des favoris du compte connecté
- Consultation et mise à jour des informations du compte connecté
- Consultation des notifications du compte connecté
- Consultation des photos
- Création de réservations pour le compte connecté
- Consultation des réservations du compte connecté
- Consultation des tarifs d'un bien pour une période donnée
- Création de logs de tentatives de connexion

Tous les endpoints devront être sécurisés et nécessiter une authentification, sauf la création de tentatives de connexion.

Cette API renverra simplement les informations au format JSON.
Elle sera mise en place sur un VPS avec comme URL d'accès api.leofranz.fr/nestvia .

Un reverse proxy est en place sur le VPS et sera à raccorder. De plus, l'accès à la base de données de l'application nécessitera un raccord à un réseau docker spécifique pour accéder à ma base de données centralisée.

Voici la configuration actuelle de mon reverse proxy:
version: "3.9"

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: always

    command:
      # Providers
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.file.directory=/etc/traefik/dynamic"
      - "--providers.file.watch=true"

      # Entrypoints
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"

      # HTTP -> HTTPS redirect
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"

      # Let's Encrypt (HTTP challenge)
      - "--certificatesresolvers.le.acme.email=${EMAIL_SSL}"
      - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"

      # Logs (tu peux passer en DEBUG si besoin)
      - "--log.level=DEBUG"

      # (Optionnel) Dashboard - je conseille de le laisser OFF au début
      # - "--api.dashboard=true"

    ports:
      - "80:80"
      - "443:443"

    # Permet à Traefik d'atteindre les applis "host" via host.docker.internal
    extra_hosts:
      - "host.docker.internal:host-gateway"

    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./traefik/acme.json:/letsencrypt/acme.json"
      - "./traefik/dynamic:/etc/traefik/dynamic:ro"

networks:
  default:
    name: proxy


Et voici la configuration du Docker de ma base de données centralisée:
version: "3.9"

services:
  mariadb:
    image: mariadb:11
    container_name: mariadb-central
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - ./data/db:/var/lib/mysql
    networks:
      - db_internal
    # Optionnel mais utile si tu as des apps NON Docker sur le VPS :
    # Expose MariaDB uniquement en local (pas public)
    ports:
      - "127.0.0.1:3306:3306"
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: pma-central
    restart: always
    environment:
      PMA_HOST: mariadb
      PMA_PORT: 3306
      PMA_ARBITRARY: 0
    networks:
      - db_internal
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.pma-db.rule=Host(`${PMA_DOMAIN}`)"
      - "traefik.http.routers.pma-db.entrypoints=websecure"
      - "traefik.http.routers.pma-db.tls.certresolver=le"
      - "traefik.http.services.pma-db.loadbalancer.server.port=80"
      - "traefik.http.middlewares.pma-db-ipallow.ipallowlist.sourcerange=${HOME_IP}"
      - "traefik.http.routers.pma-db.middlewares=pma-db-ipallow"


networks:
  db_internal:
    driver: bridge
    name: db_internal
  proxy:
    external: true

Crée l'API correspondant à ces critères en intégrant un Docker prêt à déployer.