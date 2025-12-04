# ✅ Checklist d'Implémentation - Recherche Vectorielle

## 🎯 Objectif
Implémenter une recherche vectorielle complète avec hard filtering et no-match detection.

---

## 📋 Phase 1: Préparation (15 min)

### Infrastructure
- [ ] Docker installé
- [ ] Docker Compose v2+
- [ ] Terminal/PowerShell ouvert

### Code
- [ ] Git clonée du repo
- [ ] Branch principale pullée
- [ ] `cd` dans le dossier du projet

### Dépendances
- [ ] Node.js v14+ installé
- [ ] npm v6+ ou yarn v1.22+
- [ ] `cd server && npm install meilisearch axios` ✅

---

## 🚀 Phase 2: Lancer Meilisearch (10 min)

### Option A: Docker (Recommandé)

```bash
# 1. Lancer le service
docker-compose -f docker-compose.vectorsearch.yml up -d meilisearch

# 2. Vérifier que ça tourne
curl http://localhost:7700/health
# Vous devez voir: {"status":"available"}

# 3. Marquer comme complété
- [ ] Meilisearch lancé avec Docker
```

### Option B: Installation locale

```bash
# 1. Télécharger depuis https://www.meilisearch.com/docs/learn/getting_started/installation
# 2. Lancer: meilisearch --db-path ./meilisearch-data
# 3. Vérifier: curl http://localhost:7700/health
- [ ] Meilisearch lancé localement
```

---

## ⚙️ Phase 3: Configurer les Embeddings (15 min)

### Choisir UNE option

#### ✅ OPTION 1: Hugging Face (Plus simple)

```bash
# 1. Aller sur https://huggingface.co/
# 2. S'inscrire (gratuit)
# 3. Aller sur https://huggingface.co/settings/tokens
# 4. Créer un nouveau token (lecture)
# 5. Copier le token

# 6. Ajouter au fichier .env à la racine:
echo "HUGGINGFACE_API_KEY=hf_your_token_here" >> .env

# 7. Vérifier
grep HUGGINGFACE .env

- [ ] Token Hugging Face créé
- [ ] Clé ajoutée à .env
- [ ] Testé la connexion
```

**Avantages:** Instant, gratuit, prêt à l'emploi  
**Inconvénients:** Limites de taux, dépend internet  

---

#### ✅ OPTION 2: Ollama (Meilleur choix) ⭐

```bash
# 1. Installer Ollama depuis https://ollama.ai/
# 2. Lancer le service:
ollama serve

# 3. Dans un autre terminal, télécharger le modèle:
ollama pull nomic-embed-text

# 4. Vérifier que ça marche:
curl http://localhost:11434/api/embed \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","prompt":"test"}'

# 5. Ajouter au .env:
echo "OLLAMA_HOST=http://localhost:11434" >> .env

- [ ] Ollama installé
- [ ] Service lancé
- [ ] Modèle téléchargé (nomic-embed-text)
- [ ] Configuration ajoutée à .env
```

**Avantages:** Local, illimité, rapide, pas de connexion internet  
**Inconvénients:** Nécessite ressources machine  

---

#### ✅ OPTION 3: OpenAI (Payant mais meilleur)

```bash
# 1. Créer compte sur https://openai.com/
# 2. Ajouter carte bancaire
# 3. Aller sur https://platform.openai.com/api-keys
# 4. Créer une clé API
# 5. Copier la clé

# 6. Ajouter au .env:
echo "OPENAI_API_KEY=sk_your_key" >> .env

- [ ] Compte OpenAI créé
- [ ] Carte bancaire ajoutée
- [ ] Clé API générée
- [ ] Clé ajoutée à .env
```

**Avantages:** Meilleure qualité, rapide  
**Inconvénients:** Payant (~0.02$ par 1K tokens)  

---

### ✅ Vérifier la configuration

```bash
# Vérifier que .env contient l'une des 3 clés:
grep -E "HUGGINGFACE|OLLAMA|OPENAI" .env

# Vous devez voir une ligne avec votre clé
- [ ] Configuration vérifiée
```

---

## 📦 Phase 4: Intégrer dans votre serveur (10 min)

### Ajouter les routes

**Fichier:** `server/src/index.js` (ou votre fichier principal Express)

```javascript
// 📌 AJOUTER CES LIGNES:

// 1. Après vos autres imports
const vectorSearchRoutes = require('./routes/vectorSearch');
const { setupMeilisearchIndex } = require('./services/embeddings');

// 2. Ajouter la route (après vos autres routes)
app.use('/api', vectorSearchRoutes);

// 3. Modifier app.listen() ou app.start()
app.listen(3000, async () => {
  console.log('✅ Serveur lancé sur port 3000');
  
  // Initialiser Meilisearch
  try {
    await setupMeilisearchIndex();
    console.log('✅ Index Meilisearch prêt');
  } catch (err) {
    console.warn('⚠️ Meilisearch non disponible. Mode fallback activé.');
  }
});
```

**Vérification:**
```bash
# Redémarrer votre serveur
npm run dev
# ou
npm start

# Tester l'endpoint
curl http://localhost:3000/api/search-categories

# Vous devez voir:
# {"success":true,"categories":["sac","lampe",...]}

- [ ] Routes intégrées
- [ ] Serveur redémarré
- [ ] Endpoint /search-categories fonctionne
```

---

## 🗂️ Phase 5: Indexer vos produits (10 min)

### Option A: Script rapide

```bash
# 1. Lancer le script d'indexation
cd server
node scripts/indexProducts.js

# Vous devez voir:
# ✅ X produits indexés

- [ ] Produits indexés avec succès
```

### Option B: Indexer via API

```bash
# 1. Préparer vos produits en JSON
# 2. Envoyer à l'API

curl -X POST http://localhost:3000/api/index-products \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "name": "Sac à main rouge",
        "category": "sac",
        "price": 4500,
        "description": "Sac pratique",
        "image_url": "/images/sac-1.jpg"
      }
    ]
  }'

# Réponse attendue:
# {"success":true,"message":"1 produits indexés","count":1}

- [ ] Au moins 10 produits indexés
```

---

## 🧪 Phase 6: Tester la recherche (10 min)

### Test 1: Recherche simple

```bash
curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{"query":"Je cherche un sac"}'

# Réponse:
# {
#   "success": true,
#   "query": "Je cherche un sac",
#   "category": "sac",
#   "results": [...],
#   "hasLowRelevance": false
# }

- [ ] Recherche "sac" fonctionne
- [ ] Catégorie détectée correctement
- [ ] Résultats retournés
```

### Test 2: Hard filtering

```bash
curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{
    "query":"Je cherche un sac bleu",
    "category":"sac"
  }'

# Vérifier:
# - Seuls les sacs sont retournés (pas de lampes, tables, etc)

- [ ] Hard filter fonctionne
- [ ] Catégorie forcée correctement
```

### Test 3: No match detection

```bash
curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{"query":"Je cherche un sac téléportable"}'

# Vérifier:
# - hasLowRelevance: true
# - Peu ou pas de résultats

- [ ] No-match détecté
```

---

## 🎨 Phase 7: ChatPopup.tsx est déjà mis à jour ✅

✅ Vérifier que le fichier a bien été modifié:

```bash
# 1. Vérifier que les fonctions existent
grep -n "vectorSearch\|detectCategory\|SCORE_THRESHOLD" \
  src/components/ChatPopup.tsx

# Vous devez voir:
# - Définition de vectorSearch()
# - Définition de detectCategory()
# - SCORE_THRESHOLD = 0.6

- [ ] ChatPopup.tsx contient la recherche vectorielle
- [ ] Fonction vectorSearch présente
- [ ] Fonction detectCategory présente
- [ ] Logique no-match detection en place
```

---

## ✨ Phase 8: Test complet du Chat (15 min)

### Lancer l'application

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Tester le chat

1. **Ouvrir l'app** `http://localhost:5173` (ou votre port)
2. **Cliquer sur le bouton AI** (en bas à gauche)
3. **Tester les requêtes:**

```
Test 1: "Je cherche un sac rouge"
Résultat attendu: Sacs rouges trouvés ✅

Test 2: "Je veux une lampe pour lire"
Résultat attendu: Lampes trouvées ✅

Test 3: "Je cherche un sac téléportable"
Résultat attendu: "Je n'ai rien trouvé...Voici alternatives" ⚠️

Test 4: "Quelque chose de bleu"
Résultat attendu: Produits bleus variés 🎯
```

- [ ] Test 1 réussi
- [ ] Test 2 réussi
- [ ] Test 3 réussi (no-match)
- [ ] Test 4 réussi
- [ ] Messages intelligents affichés

---

## 🎓 Phase 9: Optimisations (optionnel, 20 min)

### Augmenter la pertinence

```javascript
// Dans ChatPopup.tsx
const SCORE_THRESHOLD = 0.6; // Augmenté de 0.5 à 0.6

// Tester à nouveau:
// → Moins de faux positifs
// → Meilleure qualité
```

- [ ] Score threshold ajusté si nécessaire

### Ajouter des catégories

```javascript
// Dans embeddings.js - detectCategory()
const categoryKeywords = {
  // Ajouter vos catégories personnalisées:
  chaussures: ['chaussures', 'sneakers', 'boots'],
  bijoux: ['bague', 'collier', 'bracelet'],
  // ...
};
```

- [ ] Catégories supplémentaires ajoutées si besoin

### Améliorer le cache

```javascript
// Dans ChatPopup.tsx
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes au lieu de 5
```

- [ ] Cache ajusté si besoin

---

## 📊 Phase 10: Monitoring (optionnel, 10 min)

### Logger les stats

```bash
# Ajouter dans votre backend:
console.log('Search stats:', {
  query: userQuery,
  category: detectedCategory,
  resultsCount: results.length,
  bestScore: bestScore,
  hasLowRelevance: hasLowRelevance
});
```

- [ ] Logs de recherche activés

### Monitorer les performances

```bash
# Utiliser l'outil Network du navigateur:
# 1. F12 → Network
# 2. Faire une recherche
# 3. Vérifier temps: < 300ms 🎯
```

- [ ] Temps de réponse acceptable

---

## 🚀 Phase 11: Production (optional)

### Déployer Meilisearch

Option 1: **Meilisearch Cloud**
```
https://cloud.meilisearch.com/ → Créer un index
Copier l'API key
Mettre à jour MEILISEARCH_HOST et MEILISEARCH_API_KEY
```

Option 2: **Docker en production**
```
docker run -p 7700:7700 -v meilisearch_data:/meili_data getmeili/meilisearch
```

- [ ] Meilisearch déployé en production

### Configurer embeddings cloud

```
HUGGINGFACE_API_KEY → Utiliser clé de production
OLLAMA_HOST → Héberger Ollama sur serveur
OPENAI_API_KEY → Utiliser clé OpenAI (payant)
```

- [ ] Embeddings configurés en production

---

## ✅ Validation Finale

### Checklist complète

- [ ] Meilisearch lancé et accessible
- [ ] Embeddings configurés
- [ ] Routes intégrées dans le serveur
- [ ] Produits indexés
- [ ] ChatPopup.tsx mis à jour
- [ ] Tests de recherche réussis
- [ ] Chat fonctionne de bout en bout
- [ ] Messages intelligents affichés
- [ ] Hard filtering fonctionne
- [ ] No-match detection fonctionne

### Performance

- [ ] Temps de réponse < 300ms
- [ ] Résultats pertinents > 90%
- [ ] Pas d'erreurs JavaScript

### Utilisateur

- [ ] Chat responsive
- [ ] Résultats affichés correctement
- [ ] Images produits chargées
- [ ] Prix affichés correctement

---

## 🎉 Félicitations!

Vous avez implémenté une **solution premium de recherche vectorielle**! 

Votre e-commerce a maintenant :
✅ Compréhension sémantique  
✅ Résultats ultra-pertinents  
✅ Hard filtering par catégorie  
✅ Gestion intelligente des erreurs  

**Prêt pour la production! 🚀**

---

## 📞 Si vous avez des problèmes

1. **Meilisearch ne démarre pas**
   → Vérifier: `docker logs meilisearch`

2. **Embeddings vides**
   → Vérifier: `echo $HUGGINGFACE_API_KEY`

3. **Pas de résultats**
   → Vérifier: Produits indexés? Catégories correctes?

4. **Lent**
   → Augmenter threshold, réduire limit

5. **Erreurs JavaScript**
   → Ouvrir console (F12), vérifier logs

---

**Bon courage! 🎯**
