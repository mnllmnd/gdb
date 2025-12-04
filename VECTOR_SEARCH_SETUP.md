# Vector Search Setup Guide

## Overview
Premium vector search system using **Meilisearch** + **Sanity CMS** with 4-level intelligent fallback pipeline.

- **Primary**: Vectorial search with hard category filtering (Meilisearch)
- **Fallback 1**: Text search by category (Meilisearch)
- **Fallback 2**: Category filtering via Sanity GROQ
- **Fallback 3**: Full text search via Sanity GROQ

## Environment Variables Required

```bash
# Meilisearch (already running on Render/Vercel)
MEILISEARCH_HOST=https://your-meilisearch-instance.com
MEILISEARCH_KEY=your_api_key

# Sanity CMS
SANITY_PROJECT_ID=ynv4chv6
SANITY_DATASET=production
SANITY_TOKEN=<your_sanity_api_token>  # NOT groq_api_key, this is Sanity auth!

# Optional: Ollama (local embeddings - faster)
OLLAMA_HOST=http://localhost:11434

# Optional: Hugging Face (skipped by default due to rate limiting)
# HUGGINGFACE_API_KEY=<key>  # Not recommended - often returns 410 errors
```

### Important: Token Types
- `SANITY_TOKEN` = Sanity API authentication (for GROQ queries)
- `groq_api_key` = Groq LLM API token (used by old nlp/recommend.js - different service!)

Do NOT confuse these - they are from different vendors.

## API Endpoints

### 1. Vector Search (Main Endpoint)
```bash
POST /api/vector-search
Content-Type: application/json

{
  "query": "je veux un sac bleu",
  "category": "sac",              # Optional - auto-detected if omitted
  "limit": 8                       # Default: 8
}

Response:
{
  "success": true,
  "query": "je veux un sac bleu",
  "category": "sac",
  "results": [
    {
      "id": "product_123",
      "name": "Sac Bleu Premium",
      "category": "sac",
      "price": 4999,
      "score": 0.87
    },
    ...
  ],
  "hasLowRelevance": false,
  "source": "vectorMeilisearch",   # or: textMeilisearch, sanityCategory, sanityText
  "message": "Résultats trouvés (vectorMeilisearch)"
}
```

**Source Types:**
- `vectorMeilisearch` = High-quality semantic search (score ≥ 0.65)
- `textMeilisearch` = Text search in Meilisearch (score ≥ 0.65)
- `sanityCategory` = Sanity GROQ filtered by category
- `sanityText` = Full text search in Sanity
- `none` = No results found

**Flags:**
- `hasLowRelevance: true` = Results found but score < 0.75 (less confident)
- `hasLowRelevance: false` = High confidence results (score ≥ 0.75)

### 2. Index Products (Batch)
```bash
POST /api/index-products
Content-Type: application/json

{
  "products": [
    {
      "id": "prod_1",
      "name": "Sac à main",
      "description": "Sac en cuir véritable bleu",
      "category": "sac",
      "price": 4999
    },
    ...
  ]
}

Response:
{
  "success": true,
  "message": "15 produits indexés",
  "count": 15
}
```

### 3. Get Available Categories
```bash
GET /api/search-categories

Response:
{
  "success": true,
  "categories": ["sac", "lampe", "table", "canapé", "décoration", "mobilier", "general"]
}
```

### 4. Test Endpoint (Debug)
```bash
GET /api/search-test

# Tests with: "je veux un sac bleu" in category "sac"
# Useful for validating the entire pipeline
```

## Frontend Integration (React/TypeScript)

```typescript
// In src/components/ChatPopup.tsx

import axios from 'axios';

async function vectorSearch(query: string, detectedCategory?: string) {
  try {
    const response = await axios.post('/api/vector-search', {
      query,
      category: detectedCategory,
      limit: 8
    });

    const { results, hasLowRelevance, source } = response.data;

    if (results.length === 0) {
      return "Je n'ai rien trouvé de vraiment proche de votre recherche.";
    }

    // Check confidence level
    if (hasLowRelevance) {
      return `J'ai trouvé ${results.length} produits (mais peu sûr):\n${formatResults(results)}`;
    }

    return `J'ai trouvé ${results.length} produits:\n${formatResults(results)}`;
  } catch (error) {
    console.error('Search error:', error);
    return "Désolé, erreur lors de la recherche.";
  }
}

function detectCategory(query: string): string {
  const lower = query.toLowerCase();
  
  const patterns: Record<string, string> = {
    'sac|bag|baggage|poche': 'sac',
    'lampe|light|éclairage': 'lampe',
    'table|desk|bureau|plateau': 'table',
    'canapé|sofa|fauteuil|chair': 'canapé',
    'déco|décor|ornement|artwork': 'décoration',
    'meuble|furniture|mobilier': 'mobilier',
  };

  for (const [pattern, category] of Object.entries(patterns)) {
    if (new RegExp(pattern).test(lower)) {
      return category;
    }
  }

  return 'general';
}
```

## Score Thresholding

| Score Range | Behavior | Message |
|-------------|----------|---------|
| ≥ 0.75     | High confidence | Results shown without caveat |
| 0.65 - 0.74 | Low confidence | Results shown + `hasLowRelevance: true` |
| < 0.65     | Too low | Falls back to next level |

## Meilisearch Filter Syntax

Our system builds filters like:
```
category = "sac"                    # Single category
category IN ["sac", "lampe"]        # Multiple categories
(no filter)                         # General search
```

Never sends malformed filters like `filter: "category"` or empty filters.

## Sanity GROQ Queries

Example query for fallback search:
```groq
*[_type == "product" && category == "sac"] {
  _id,
  name,
  description,
  category,
  price
} | order(_createdAt desc) | [0..8]
```

Uses **Bearer token** in Authorization header:
```
Authorization: Bearer <SANITY_TOKEN>
```

## Troubleshooting

### "Meilisearch invalid_search_filter"
❌ Old: `filter: "category"` (incomplete filter)
✅ New: `category = "sac"` (valid syntax)

Our `buildMeilisearchFilter()` function ensures proper syntax.

### "Sanity 401 Unauthorized"
❌ Old: Using `groq_api_key` (Groq LLM token)
✅ New: Using `SANITY_TOKEN` with Bearer header (Sanity auth)

Verify env var: `echo $SANITY_TOKEN` should output a valid token.

### "Hugging Face 410 Gone"
The HF embedding API is rate-limited. Our system:
1. Tries Ollama first (if available - fastest)
2. Falls back to pseudo-embedding (local, deterministic)
3. Never blocks on HF failures

### "No results found"
Check:
1. Are products indexed? → `POST /api/index-products`
2. Is category correct? → `GET /api/search-categories`
3. Is score too high? → Lower threshold if needed
4. Are Sanity credentials valid? → Check SANITY_TOKEN

### "Wrong results (mangue shows Shoe)"
Old issue - fixed:
- Score threshold raised to 0.65 minimum
- Removed fallback to searchRealProducts()
- Strict category filtering

## Deployment

### Render (Backend)
```bash
# Environment variables in Render dashboard
MEILISEARCH_HOST=...
MEILISEARCH_KEY=...
SANITY_PROJECT_ID=...
SANITY_DATASET=...
SANITY_TOKEN=...
```

### Vercel (Frontend)
No additional vector search variables needed (calls backend /api endpoints).

## Testing

### Local Test
```bash
# Start server
cd server && npm start

# Test vector search
curl -X POST http://localhost:3000/api/vector-search \
  -H "Content-Type: application/json" \
  -d '{"query":"je veux un sac","limit":8}'

# Test debug endpoint
curl http://localhost:3000/api/search-test
```

### Production Test
Replace `http://localhost:3000` with your Render backend URL.

## Architecture

```
User Query (ChatPopup)
    ↓
Detect Category (regex)
    ↓
POST /api/vector-search
    ↓
smartSearch() in embeddings.js
    ↓
┌─────────────────────────────────────────┐
│ Level 1: vectorSearch (Meilisearch)     │ ← High relevance (score ≥ 0.75)
│ - Generate embedding                    │
│ - Search with category filter           │
│ - Requires score ≥ 0.65                 │
└─────────────────────────────────────────┘
    ↓ (if no results or score < 0.65)
┌─────────────────────────────────────────┐
│ Level 2: textSearchMeilisearch           │ ← Lower relevance (score ≥ 0.65)
│ - Full text search in Meilisearch       │
│ - Category filter applied               │
└─────────────────────────────────────────┘
    ↓ (if still no results)
┌─────────────────────────────────────────┐
│ Level 3: searchSanityByCategory         │ ← GROQ category filter
│ - Query Sanity with category filter     │
│ - Uses SANITY_TOKEN Bearer auth         │
└─────────────────────────────────────────┘
    ↓ (if still no results)
┌─────────────────────────────────────────┐
│ Level 4: searchSanityByText             │ ← Full text (last resort)
│ - Search all products in Sanity         │
│ - No category restriction               │
└─────────────────────────────────────────┘
    ↓
Return Results + Source + hasLowRelevance flag
```

## Performance Notes

- **Meilisearch**: ~50-100ms per search (cached indices)
- **Sanity GROQ**: ~200-300ms per query
- **Embedding generation**: 
  - Ollama: ~100-200ms (if local)
  - Pseudo-embedding: <1ms
  - HF API: 500ms+ (skipped by default)

Total end-to-end: 50-300ms depending on which fallback level is used.

## Code Files

- `server/src/services/embeddings.js` - Core service (437 lines)
- `server/src/routes/vectorSearch.js` - API routes (165 lines)
- `src/components/ChatPopup.tsx` - Frontend integration
- `server/src/index.js` - Server integration (imports + setup)

## Last Updated
Latest refactor: Complete rewrite of embeddings.js with robust filter building and Sanity auth fixes.
