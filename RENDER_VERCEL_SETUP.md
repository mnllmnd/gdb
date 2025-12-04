# Configuration Meilisearch Cloud + Embeddings pour Render/Vercel

## 1. Meilisearch Cloud

Aller sur: https://cloud.meilisearch.com/

1. Créer un compte (gratuit)
2. Créer un nouveau projet
3. Copier l'URL et la clé API
4. Ajouter à vos variables d'environnement Render/Vercel:

```
MEILISEARCH_HOST=https://xxxxx.meilisearch.com
MEILISEARCH_API_KEY=mnxxxxx
```

## 2. Embeddings - Options

### Option A: Hugging Face (Recommandé - Gratuit)

```
https://huggingface.co/settings/tokens
→ Créer token (Read)
→ Copier dans vos env vars:

HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

### Option B: OpenAI (Meilleur - Payant)

```
https://platform.openai.com/api-keys
→ Créer clé
→ Ajouter dans env vars:

OPENAI_API_KEY=sk_xxxxxxxxxxxxx
```

## 3. Variables d'env Render

Aller dans: Project Settings → Environment

Ajouter:
```
MEILISEARCH_HOST=https://xxxxx.meilisearch.com
MEILISEARCH_API_KEY=mnxxxxx
HUGGINGFACE_API_KEY=hf_xxxxx
VECTOR_SEARCH_ENABLED=true
```

## 4. Variables d'env Vercel

Aller dans: Settings → Environment Variables

Ajouter les mêmes variables

## 5. Déployer

```bash
git push
# Render/Vercel redéploie automatiquement
```

## 6. Indexer les produits (une fois)

```bash
curl -X POST https://votre-app.onrender.com/api/index-products \
  -H "Content-Type: application/json" \
  -d '{
    "products": [...vos produits...]
  }'
```

Ou via script:
```bash
NODE_ENV=production API_ROOT=https://votre-app.onrender.com node scripts/initVectorSearch.js
```

C'est tout! 🚀
