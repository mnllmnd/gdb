# 🚀 Solution Premium: Moteur de Recherche Vectoriel

Documentation complète pour implémenter la recherche vectorielle dans votre chat AI.

---

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Utilisation](#utilisation)
5. [Déploiement](#déploiement)

---

## 🏗️ Architecture

### Composants

```
┌─────────────────────────────────────────────────┐
│         Frontend (ChatPopup.tsx)                │
│  - Détection de catégorie                       │
│  - Affichage des résultats                      │
│  - Gestion des messages de fallback             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      Backend API (vectorSearch.js)              │
│  - Endpoint /api/vector-search                  │
│  - Hard filtering par catégorie                 │
│  - Gestion du fallback textuel                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Service d'Embeddings (embeddings.js)           │
│  - Génération d'embeddings                      │
│  - Similarité cosinus                           │
│  - Cache local                                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      Meilisearch (Vecteurs + Texte)             │
│  - Index vectoriel des produits                 │
│  - Filtres facettés (catégories)                │
│  - Recherche hybride                            │
└─────────────────────────────────────────────────┘
```

### Flux de recherche

```
Utilisateur: "Je cherche un sac rouge"
    ↓
1. Détection de catégorie: "sac" ✅
    ↓
2. Génération d'embedding pour la requête
    ↓
3. Hard Filter: Rechercher UNIQUEMENT dans la catégorie "sac"
    ↓
4. Calcul de similarité cosinus
    ↓
5a. Score ≥ 0.6? → Résultats pertinents ✅
5b. Score < 0.6? → Message "No Match Detection" ⚠️
5c. Pas de résultats? → Alternatives générales 🔄
```

---

## ⚙️ Installation

### 1️⃣ Dépendances Node.js

Installez les packages requis dans le répertoire `server/` :

```bash
cd server
npm install meilisearch axios
```

### 2️⃣ Docker - Lancer Meilisearch

```bash
# Option 1: Utiliser le docker-compose fourni
docker-compose -f docker-compose.vectorsearch.yml up -d meilisearch

# Option 2: Sans Docker (installation locale)
# Voir: https://www.meilisearch.com/docs/learn/getting_started/installation
```

### 3️⃣ Configuration d'Embeddings

Choisir **UNE** option pour les embeddings :

#### Option A: Hugging Face (Cloud - Gratuit)

```bash
# 1. Créer un compte: https://huggingface.co/
# 2. Générer une clé API: https://huggingface.co/settings/tokens
# 3. Ajouter à .env:
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxx
```

**Avantages:** ✅ Prêt à l'emploi, modèles gratuits  
**Inconvénients:** ❌ Limites de taux, dépend de la connexion internet

---

#### Option B: Ollama (Local - Gratuit) ⭐ RECOMMANDÉ

```bash
# 1. Installer Ollama: https://ollama.ai/
# 2. Lancer le service:
ollama serve

# 3. Télécharger le modèle d'embeddings dans un terminal:
ollama pull nomic-embed-text

# 4. Ajouter à .env:
OLLAMA_HOST=http://localhost:11434
```

**Avantages:** ✅ Local, illimité, rapide  
**Inconvénients:** ❌ Nécessite ressources CPU/GPU

---

#### Option C: OpenAI (Cloud - Payant)

```bash
# 1. Créer un compte: https://openai.com/
# 2. Générer une clé API
# 3. Ajouter à .env:
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```

**Avantages:** ✅ Meilleure qualité, rapide  
**Inconvénients:** ❌ Coûteux (env. $0.02 par 1K tokens)

---

### 4️⃣ Intégrer les routes dans votre serveur

Dans votre fichier principal `server/src/index.js` :

```javascript
const vectorSearchRoutes = require('./routes/vectorSearch');

// Ajouter la route
app.use('/api', vectorSearchRoutes);

// Initialiser Meilisearch au démarrage
const { setupMeilisearchIndex } = require('./services/embeddings');
setupMeilisearchIndex().catch(err => console.error('Meilisearch init failed:', err));
```

---

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey

# Embeddings (choisir UN)
HUGGINGFACE_API_KEY=hf_xxxxx
# OU
OLLAMA_HOST=http://localhost:11434
# OU
OPENAI_API_KEY=sk_xxxxx

# Search
SEARCH_SCORE_THRESHOLD=0.5    # Minimum 0.5 pour pertinence
SEARCH_RESULT_LIMIT=8         # Résultats max par recherche
VECTOR_SEARCH_ENABLED=true

# Hard Filtering
HARD_FILTER_ENABLED=true
AUTO_DETECT_CATEGORY=true
```

### Catégories supportées

Les catégories détectées automatiquement :

```javascript
{
  sac: ['sac', 'sacoche', 'cartable', 'besace', 'poche'],
  lampe: ['lampe', 'luminaire', 'suspension', 'applique', 'éclairage'],
  table: ['table', 'bureau', 'desk', 'plateau'],
  canapé: ['canapé', 'sofa', 'divan', 'fauteuil'],
  décoration: ['décor', 'déco', 'ornement', 'cadre', 'poster'],
  mobilier: ['meuble', 'chaise', 'tabouret', 'rangement'],
}
```

---

## 📖 Utilisation

### Indexer vos produits

```bash
# Endpoint POST pour indexer des produits

curl -X POST http://localhost:3000/api/index-products \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "name": "Sac à main élégant",
        "category": "sac",
        "price": 4500,
        "description": "Sac à main en cuir véritable, capacité 20L",
        "image_url": "/images/sac-1.jpg"
      },
      {
        "id": 2,
        "name": "Lampe de bureau LED",
        "category": "lampe",
        "price": 2500,
        "description": "Lampe LED dimmable, 3 niveaux de luminosité",
        "image_url": "/images/lampe-1.jpg"
      }
    ]
  }'
```

**Réponse:**
```json
{
  "success": true,
  "message": "2 produits indexés",
  "count": 2
}
```

### Recherche vectorielle

```bash
# Endpoint POST pour recherche intelligente

curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Je cherche un sac rouge pratique",
    "category": null,
    "limit": 8
  }'
```

**Réponse:**
```json
{
  "success": true,
  "query": "Je cherche un sac rouge pratique",
  "category": "sac",  // Détecté automatiquement
  "results": [
    {
      "id": 1,
      "name": "Sac à main élégant",
      "price": 4500,
      "category": "sac",
      "similarityScore": 0.87,
      "image_url": "/images/sac-1.jpg"
    }
  ],
  "hasLowRelevance": false,
  "isTextFallback": false,
  "message": "Résultats trouvés"
}
```

---

## 🎯 Hard Filtering - Exemples

### ✅ Bon comportement

```
Utilisateur: "Je cherche un sac rouge"
Catégorie détectée: "sac"
➜ Cherche UNIQUEMENT dans les sacs
➜ Ignore les lampes, tables, etc.
```

### ⚠️ Fallback avec alternatives

```
Utilisateur: "Je cherche un sac bleu très spécifique"
Catégorie détectée: "sac"
Résultats dans "sac": []
Message: "Je n'ai rien trouvé de vraiment proche. Voici quelques alternatives plus générales."
Affiche: Sacs similaires (mais moins pertinents)
```

---

## 🚀 Déploiement

### Production - Render ou Vercel

#### 1. Environnement

Ajouter à votre service Render/Vercel :

```
MEILISEARCH_HOST=https://meilisearch.votredomaine.com
MEILISEARCH_API_KEY=[secure key]
HUGGINGFACE_API_KEY=[secure key]
```

#### 2. Meilisearch Cloud

Utiliser Meilisearch Cloud au lieu de local :

```bash
# 1. S'inscrire: https://cloud.meilisearch.com/
# 2. Copier votre clé API
# 3. Ajouter à .env:
MEILISEARCH_HOST=https://xxxxx.meilisearch.com
MEILISEARCH_API_KEY=[votre clé]
```

#### 3. Ollama en Production

Option 1: **Hébergé (recommandé)**
```bash
# Utiliser Hugging Face ou OpenAI au lieu d'Ollama
```

Option 2: **Conteneur Docker**
```bash
# Dans votre docker-compose production
docker-compose --profile embeddings up -d ollama
```

---

## 📊 Performance & Optimisations

### Caching

Les résultats sont cachés pendant 5 minutes :

```javascript
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
```

### Score Threshold

- `0.9+` : Résultats excellents ⭐
- `0.7-0.9` : Résultats bons ✅
- `0.5-0.7` : Résultats acceptables ⚠️
- `<0.5` : Résultats faibles ❌

### Tuner le threshold

```javascript
// Dans embeddings.js
const SCORE_THRESHOLD = 0.5; // Augmenter à 0.6 pour plus de strictness

// Ou via API
POST /api/vector-search
{
  "query": "...",
  "threshold": 0.6
}
```

---

## 🐛 Troubleshooting

### Meilisearch ne démarre pas

```bash
# Vérifier le statut
docker ps | grep meilisearch

# Logs
docker logs meilisearch

# Redémarrer
docker restart meilisearch
```

### Embeddings vides

```bash
# Vérifier la clé API
echo $HUGGINGFACE_API_KEY

# Tester la connexion
curl https://api-inference.huggingface.co/status \
  -H "Authorization: Bearer YOUR_KEY"
```

### Recherche trop lente

- ✅ Réduire `SEARCH_RESULT_LIMIT`
- ✅ Augmenter `SCORE_THRESHOLD`
- ✅ Ajouter plus de CPU/RAM si local

---

## 📚 Ressources

- [Meilisearch Docs](https://www.meilisearch.com/docs)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)
- [Ollama](https://ollama.ai/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

## ✨ Fonctionnalités Premium Activées

✅ **Recherche vectorielle** - Résultats ultra pertinents  
✅ **Hard filtering** - Respect strict des catégories  
✅ **No match detection** - Messages clairs quand pas de résultats  
✅ **Auto-détection catégorie** - Comprend les intentions utilisateur  
✅ **Fallback intelligent** - Alternatives générales si besoin  
✅ **Caching** - Performances optimisées  

---

## 🎓 Prochaines étapes

1. ✅ Indexer vos produits
2. ✅ Tester la recherche vectorielle
3. ✅ Affiner les catégories
4. ✅ Déployer en production

Bon courage! 🚀
