# 🚀 Quick Start - Solution Vectorielle

## ⚡ Installation en 5 minutes

### 1. Installer les dépendances

```bash
cd server
npm install meilisearch axios
cd ..
```

### 2. Lancer Meilisearch

```bash
# Option A: Docker (recommandé)
docker-compose -f docker-compose.vectorsearch.yml up -d meilisearch

# Option B: Sans Docker
# Télécharger depuis https://www.meilisearch.com/docs/learn/getting_started/installation

# Vérifier que Meilisearch tourne:
curl http://localhost:7700/health
```

### 3. Configurer les embeddings

#### Choix 1: Hugging Face (Cloud - Plus simple)

```bash
# 1. Créer un compte: https://huggingface.co/
# 2. Générer une clé: https://huggingface.co/settings/tokens
# 3. Ajouter au .env:
echo "HUGGINGFACE_API_KEY=hf_YOUR_KEY" >> .env
```

#### Choix 2: Ollama (Local - Meilleur)

```bash
# 1. Installer: https://ollama.ai/
# 2. Terminal 1:
ollama serve

# 3. Terminal 2:
ollama pull nomic-embed-text

# 4. Ajouter au .env:
echo "OLLAMA_HOST=http://localhost:11434" >> .env
```

### 4. Intégrer dans votre serveur

Dans `server/src/index.js`, ajouter :

```javascript
// 📌 Ajouter après vos imports
const vectorSearchRoutes = require('./routes/vectorSearch');
const { setupMeilisearchIndex } = require('./services/embeddings');

// 📌 Ajouter avant app.listen()
app.use('/api', vectorSearchRoutes);

// 📌 Initialiser à la démarrage
app.listen(3000, async () => {
  console.log('✅ Serveur lancé');
  
  try {
    await setupMeilisearchIndex();
    console.log('✅ Index Meilisearch prêt');
  } catch (err) {
    console.warn('⚠️ Meilisearch non disponible, mode fallback');
  }
});
```

### 5. Indexer vos produits

```bash
# Terminal 3:
cd server
node scripts/indexProducts.js
```

### 6. Tester

```bash
# Requête de test
curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Je cherche un sac rouge",
    "limit": 4
  }'
```

---

## ✅ Checklist

- [ ] Meilisearch lancé (docker ou local)
- [ ] Embeddings configurés (HuggingFace ou Ollama)
- [ ] Routes intégrées dans votre serveur
- [ ] Produits indexés
- [ ] ChatPopup.tsx mis à jour
- [ ] Tester la recherche

---

## 🎯 Résultats attendus

### ✅ Cas 1: Requête claire avec catégorie

```
Utilisateur: "Je cherche un sac rouge"
↓
Catégorie détectée: "sac"
Hard filter: Cherche uniquement dans les sacs
Score: 0.87 (pertinent)
↓
Message: "J'ai trouvé 3 produit(s) ultra pertinent(s) :"
+ 3 sacs affichés
```

### ⚠️ Cas 2: Requête spécifique sans résultats

```
Utilisateur: "Je cherche un sac télépathique"
↓
Catégorie détectée: "sac"
Hard filter: Cherche uniquement dans les sacs
Score: 0.35 (faible)
↓
Message: "Je n'ai rien trouvé de vraiment proche. Voici quelques alternatives plus générales."
+ Sacs généraux en fallback
```

### 🔄 Cas 3: Pas de catégorie détectée

```
Utilisateur: "Je cherche quelque chose de bleu"
↓
Catégorie: null
Recherche sur tous les produits
↓
Message: Si pertinence bonne → résultats
         Si pertinence faible → alternatives générales
```

---

## 📊 Architecture

```
ChatPopup.tsx (Frontend)
    ↓ axios.post(/api/vector-search)
API Endpoint (vectorSearch.js)
    ↓ smartSearch()
Service Embeddings (embeddings.js)
    ↓ vectorSearch() + hard filtering
Meilisearch (Index vectoriel)
    ↓ Résultats avec scores
```

---

## 🔧 Optimisations (optionnel)

### Augmenter la pertinence

```javascript
// Dans ChatPopup.tsx
const SCORE_THRESHOLD = 0.6; // Au lieu de 0.5
```

### Ajouter plus de catégories

```javascript
// Dans embeddings.js - detectCategoryFromQuery()
const categoryKeywords = {
  // Ajouter ici:
  chaussures: ['chaussures', 'shoes', 'boots', 'sneakers'],
  bijoux: ['bague', 'collier', 'bracelet'],
  // etc...
};
```

### Tuner le cache

```javascript
// Dans ChatPopup.tsx
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes au lieu de 5
```

---

## 🐛 Debug

```bash
# Vérifier Meilisearch
curl http://localhost:7700/health

# Vérifier embeddings (Ollama)
curl http://localhost:11434/api/embed \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","prompt":"test"}'

# Vérifier API
curl http://localhost:3000/api/search-categories
```

---

## 📚 Documentation complète

Voir: `VECTOR_SEARCH_GUIDE.md`

---

## 🎓 Prochaines étapes

1. ✅ Tester avec quelques produits
2. ✅ Indexer tous les produits
3. ✅ Affiner les catégories selon vos besoins
4. ✅ Déployer en production

Bon courage! 🚀
