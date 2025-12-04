#!/bin/bash

# Tests rapides de la recherche vectorielle

echo "🧪 Test 1: Vérifier Meilisearch"
curl http://localhost:7700/health

echo -e "\n\n🧪 Test 2: Liste des catégories"
curl http://localhost:3000/api/search-categories

echo -e "\n\n🧪 Test 3: Recherche simple"
curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{
    "query":"Je cherche un sac",
    "limit":4
  }'

echo -e "\n\n✅ Tests complétés"
