BASE="https://api.leofranz.fr/nestvia"

# ============================================================
# 1. ROUTES PUBLIQUES
# ============================================================

# Health check
echo "=== Health ==="
curl -s "$BASE/health" | jq

# Tentative de connexion (public)
echo "=== Tentative de connexion ==="
curl -s -X POST "$BASE/tentatives" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' | jq

# Vérifier qu'un endpoint protégé refuse sans token
echo "=== Accès sans token (doit retourner 401) ==="
curl -s "$BASE/biens" | jq

# ============================================================
# 2. AUTHENTIFICATION
# ============================================================

echo "=== Login ==="
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "contact@leofranz.fr", "password": "6zfx8##RJ6vZtXFmVk11"}' | jq -r '.token')
echo "Token: $TOKEN"

# ============================================================
# 3. BIENS (nécessite token)
# ============================================================

echo "=== Liste des biens ==="
curl -s "$BASE/biens" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Détail du bien 1 ==="
curl -s "$BASE/biens/1" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Blocages du bien 1 ==="
curl -s "$BASE/biens/1/blocages" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Photos du bien 1 ==="
curl -s "$BASE/biens/1/photos" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Tarifs du bien 1 ==="
curl -s "$BASE/biens/1/tarifs" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Tarifs du bien 1 (période) ==="
curl -s "$BASE/biens/1/tarifs?date_debut=2026-06-01&date_fin=2026-08-31" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 4. COMMUNES
# ============================================================

echo "=== Communes (recherche 'Paris') ==="
curl -s "$BASE/communes?search=Paris&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Commune par ID ==="
curl -s "$BASE/communes/1" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 5. COMPTE CONNECTÉ
# ============================================================

echo "=== Mon compte ==="
curl -s "$BASE/compte" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Mise à jour du téléphone ==="
curl -s -X PUT "$BASE/compte" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tel_locataire": "0601020304"}' | jq

# ============================================================
# 6. FAVORIS
# ============================================================

echo "=== Mes favoris ==="
curl -s "$BASE/favoris" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 7. NOTIFICATIONS
# ============================================================

echo "=== Mes notifications ==="
curl -s "$BASE/notifications" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Marquer notification 1 comme lue ==="
curl -s -X PATCH "$BASE/notifications/1/read" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 8. PHOTOS
# ============================================================

echo "=== Toutes les photos ==="
curl -s "$BASE/photos" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Photo par ID ==="
curl -s "$BASE/photos/1" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 9. TARIFS (route dédiée)
# ============================================================

echo "=== Tarifs du bien 1 via /tarifs ==="
curl -s "$BASE/tarifs?id_bien=1" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Tarifs du bien 1 (période) via /tarifs ==="
curl -s "$BASE/tarifs?id_bien=1&date_debut=2026-06-01&date_fin=2026-08-31" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 10. RÉSERVATIONS
# ============================================================

echo "=== Mes réservations ==="
curl -s "$BASE/reservations" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Créer une réservation ==="
curl -s -X POST "$BASE/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date_debut": "2026-09-01",
    "date_fin": "2026-09-08",
    "id_bien": 1,
    "id_tarif": 1
  }' | jq

echo "=== Détail réservation 1 ==="
curl -s "$BASE/reservations/1" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================
# 11. ERREURS ATTENDUES
# ============================================================

echo "=== Bien inexistant (doit retourner 404) ==="
curl -s "$BASE/biens/99999" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Route inexistante (doit retourner 404) ==="
curl -s "$BASE/inexistant" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Token invalide (doit retourner 401) ==="
curl -s "$BASE/biens" \
  -H "Authorization: Bearer token_invalide" | jq