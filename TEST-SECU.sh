#!/usr/bin/env bash
set -euo pipefail

BASE="https://api.leofranz.fr/nestvia"

# Générer un token localement
TOKEN=$(node -e "
const jwt=require('jsonwebtoken');
console.log(jwt.sign({id:26,email:'contact@leofranz.fr'},'@cv^^8j^gDe\$TmRwLnhq9eD2cFV!mS#3',{expiresIn:'1h'}));
")

H1="Authorization: Bearer $TOKEN"
H2="Content-Type: application/json"

echo "========================================"
echo "  TESTS DE SÉCURITÉ - API NESTVIA"
echo "========================================"

echo ""
echo "===== VALIDATION DES INPUTS ====="
echo ""

echo "--- TEST V1: Modifier id_locataire (champ interdit) ---"
curl -s -X PUT "$BASE/compte" -H "$H1" -H "$H2" -d '{"id_locataire": 1}'
echo ""

echo "--- TEST V2: Modifier pass_locataire directement (doit être ignoré) ---"
curl -s -X PUT "$BASE/compte" -H "$H1" -H "$H2" -d '{"pass_locataire": "hacked"}'
echo ""

echo "--- TEST V3: Injecter un champ inexistant (is_admin, role) ---"
curl -s -X PUT "$BASE/compte" -H "$H1" -H "$H2" -d '{"is_admin": true, "role": "admin"}'
echo ""

echo "--- TEST V4: Modifier id + nom (id doit être ignoré) ---"
curl -s -X PUT "$BASE/compte" -H "$H1" -H "$H2" -d '{"id_locataire": 1, "nom_locataire": "TEST_SECU"}'
echo ""

echo "--- TEST V5: JWT avec mauvais secret ---"
FAKE=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({id:1},'wrong_secret',{expiresIn:'1h'}))")
curl -s "$BASE/favoris" -H "Authorization: Bearer $FAKE"
echo ""

echo "--- TEST V6: JWT forgé pour un autre user (bon secret, id=1) ---"
FORGED=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({id:1,email:'fake@hack.com'},'@cv^^8j^gDe\$TmRwLnhq9eD2cFV!mS#3',{expiresIn:'1h'}))")
curl -s "$BASE/compte" -H "Authorization: Bearer $FORGED"
echo ""

echo ""
echo "===== INJECTIONS SQL ====="
echo ""

echo "--- TEST SQL1: Injection dans le login email ---"
curl -s -X POST "$BASE/tentatives" -H "$H2" -d '{"email": "admin'\'' OR 1=1 --"}'
echo ""

echo "--- TEST SQL2: Injection dans paramètre ID bien ---"
curl -s "$BASE/biens/1%20OR%201%3D1" -H "$H1"
echo ""

echo "--- TEST SQL3: Injection dans search communes ---"
curl -s "$BASE/communes?search=Paris%27%20OR%201%3D1%20--&limit=5" -H "$H1"
echo ""

echo "--- TEST SQL4: Injection UNION dans ID bien ---"
curl -s "$BASE/biens/1%20UNION%20SELECT%20*%20FROM%20administrateurs%20--" -H "$H1"
echo ""

echo "--- TEST SQL5: Injection dans le body PUT compte ---"
curl -s -X PUT "$BASE/compte" -H "$H1" -H "$H2" -d '{"nom_locataire": "FRANZ'\''  ; DROP TABLE locataire; --"}'
echo ""

echo "--- TEST SQL6: Injection dans tarifs query params ---"
curl -s "$BASE/tarifs?id_bien=1%20OR%201%3D1" -H "$H1"
echo ""

echo "--- TEST SQL7: Injection dans date_debut réservation ---"
curl -s -X POST "$BASE/reservations" -H "$H1" -H "$H2" \
  -d '{"date_debut":"2026-01-01'\'' OR 1=1 --","date_fin":"2026-01-08","id_bien":34,"id_tarif":38}'
echo ""

echo "--- TEST SQL8: Injection dans email tentatives ---"
curl -s -X POST "$BASE/tentatives" -H "$H2" \
  -d '{"email": "x'\'' UNION SELECT pass_admin FROM administrateurs --"}'
echo ""

echo ""
echo "===== RESTAURATION =====  "
echo "--- Restaurer le nom original ---"
curl -s -X PUT "$BASE/compte" -H "$H1" -H "$H2" -d '{"nom_locataire": "FRANZ"}'
echo ""
echo ""
echo "===== FIN DES TESTS ====="
