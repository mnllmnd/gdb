/**
 * Service d'embeddings vectoriels AVANCÉ
 * Architecture: Cache LRU + Embeddings pré-indexés + Pipeline hybride intelligent
 * 
 * FEATURES:
 * - Cache LRU avec statistiques
 * - Logging multi-niveaux structuré
 * - Retry stratégique avec backoff exponentiel
 * - Métriques temps réel
 * - Détection catégories hiérarchique
 * - Similarité cosinus optimisée
 * - Fallbacks multiples avec priorités
 */

import axios from 'axios';
import { MeiliSearch } from 'meilisearch';
import crypto from 'crypto';

// === CONFIG ===
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || 'masterKey';
const EMBEDDING_DIMENSION = 384;
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL_MS = 3600000; // 1 heure
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_INITIAL_DELAY_MS = 100;

let meiliClient = null;

// === CACHE LRU ===
class LRUCache {
  constructor(maxSize = 1000, ttlMs = 3600000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      createdAt: Date.now(),
    };
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
    });
  }

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const item = this.cache.get(key);
    if (Date.now() - item.createdAt > this.ttlMs) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      uptime: Math.floor((Date.now() - this.stats.createdAt) / 1000) + 's',
    };
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, createdAt: Date.now() };
  }
}

const embeddingCache = new LRUCache(CACHE_MAX_SIZE, CACHE_TTL_MS);
const searchCache = new LRUCache(CACHE_MAX_SIZE, CACHE_TTL_MS);

// === LOGGING STRUCTURÉ ===
class StructuredLogger {
  constructor(component) {
    this.component = component;
    this.level = process.env.LOG_LEVEL || 'INFO';
    this.levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  }

  log(level, message, data = {}) {
    if (this.levels[level] < this.levels[this.level]) return;

    const timestamp = new Date().toISOString();
    const icon = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
    }[level] || '📌';

    const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`${timestamp} ${icon} [${this.component}:${level}] ${message}${dataStr}`);
  }

  debug(msg, data) { this.log('DEBUG', msg, data); }
  info(msg, data) { this.log('INFO', msg, data); }
  warn(msg, data) { this.log('WARN', msg, data); }
  error(msg, data) { this.log('ERROR', msg, data); }
}

const logger = new StructuredLogger('EmbeddingService');

// === MÉTRIQUES ===
class Metrics {
  constructor() {
    this.data = {
      searches: 0,
      semanticHits: 0,
      meilisearchHits: 0,
      keywordHits: 0,
      avgResponseTime: 0,
      responseTimes: [],
      embeddingGenerations: 0,
      embeddingErrors: 0,
      cacheHits: 0,
      startedAt: Date.now(),
    };
  }

  recordSearch(source, responseTime) {
    this.data.searches++;
    this.data.responseTimes.push(responseTime);
    if (this.data.responseTimes.length > 100) this.data.responseTimes.shift();
    this.data.avgResponseTime = Math.round(
      this.data.responseTimes.reduce((a, b) => a + b, 0) / this.data.responseTimes.length
    );

    if (source === 'semantic') this.data.semanticHits++;
    if (source === 'meilisearch') this.data.meilisearchHits++;
    if (source === 'meilisearch_keyword') this.data.keywordHits++;
  }

  recordEmbedding(success) {
    this.data.embeddingGenerations++;
    if (!success) this.data.embeddingErrors++;
  }

  recordCacheHit() {
    this.data.cacheHits++;
  }

  getReport() {
    const uptime = Math.floor((Date.now() - this.data.startedAt) / 1000);
    return {
      ...this.data,
      uptimeSeconds: uptime,
      semanticSuccessRate: this.data.searches > 0 
        ? (this.data.semanticHits / this.data.searches * 100).toFixed(2) + '%'
        : '0%',
    };
  }
}

const metrics = new Metrics();

// === RETRY STRATÉGIQUE ===
async function retryWithBackoff(fn, maxAttempts = RETRY_MAX_ATTEMPTS, initialDelay = RETRY_INITIAL_DELAY_MS) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        logger.debug(`Retry attempt ${attempt}/${maxAttempts}`, { delay });
      }
    }
  }
  throw lastError;
}

// === MEILISEARCH ===

export function initMeilisearch() {
  if (!meiliClient) {
    meiliClient = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_API_KEY,
    });
  }
  return meiliClient;
}

// === DÉTECTION CATÉGORIES HIÉRARCHIQUE ===
export function extractCategoryFromQuery(query) {
  // Hiérarchie: Spécifique → Générique
  const keywordToCategoryMap = {
    'Accessoires': {
      weight: 1,
      keywords: ['sac', 'sacoche', 'cartable', 'besace', 'ceinture', 'ceintures', 'chapeau', 'casquette', 'écharpe', 'gants', 'portefeuille', 'montre', 'lunettes', 'bag', 'bags', 'shoe', 'shoes', 'chaussure', 'sneaker', 'boot', 'boots'],
    },
    'Vêtements': {
      weight: 2,
      keywords: ['vetement', 'robe', 'pantalon', 'chemise', 'manteau', 'pull', 'tshirt', 'tee-shirt', 'shirt', 'blouse', 'veste', 'jacket', 'habit', 'costume'],
    },
    'Électronique': {
      weight: 2.5,
      keywords: ['ordinateur', 'computer', 'laptop', 'portable', 'pc', 'téléphone', 'phone', 'mobile', 'tablette', 'tablet', 'ipad', 'écran', 'screen', 'clavier', 'keyboard', 'souris', 'mouse', 'casque', 'headphone', 'écouteur', 'earphone', 'console', 'gaming', 'appareil', 'device', 'électronique', 'électrique'],
    },
    'Art & Décoration': {
      weight: 3,
      keywords: ['lampe', 'luminaire', 'suspension', 'cadre', 'poster', 'tableau', 'décor', 'déco', 'ornement', 'peinture', 'sculpture', 'fleur', 'plante', 'lamp', 'art', 'decoration', 'décoration'],
    },
    'Maison': {
      weight: 4,
      keywords: ['table', 'bureau', 'desk', 'canapé', 'sofa', 'fauteuil', 'chaise', 'meuble', 'rangement', 'lit', 'armoire', 'commode', 'étagère', 'porte-manteau', 'furniture', 'chair', 'bed', 'cuisine', 'kitchen', 'salle', 'room'],
    },
    'Bijoux': {
      weight: 5,
      keywords: ['bijou', 'bague', 'collier', 'bracelet', 'montre', 'boucle', 'oreille', 'pendentif', 'chaîne', 'ring', 'necklace', 'jewelry', 'or', 'argent', 'or', 'diamond', 'diamant'],
    },
    'Cosmétiques': {
      weight: 6,
      keywords: ['cosmetique', 'crème', 'parfum', 'maquillage', 'soin', 'shampooing', 'savon', 'deodorant', 'creme', 'cream', 'perfume', 'makeup', 'cosmetic', 'beauté', 'beauty', 'skincare'],
    },
    'Alimentation': {
      weight: 7,
      keywords: ['alimentation', 'cafe', 'thé', 'chocolat', 'bonbon', 'gateau', 'biscuit', 'sucre', 'miel', 'coffee', 'tea', 'food', 'eating', 'nourriture', 'boisson', 'drink', 'snack', 'fruit', 'fruite', 'banane', 'banana', 'pomme', 'orange', 'raisin'],
    },
    'Livres': {
      weight: 8,
      keywords: ['livre', 'roman', 'bd', 'magazine', 'ebook', 'journal', 'book', 'books', 'littérature', 'literature', 'lecture'],
    },
  };

  const queryLower = query.toLowerCase();
  const matched = [];

  for (const [category, { keywords }] of Object.entries(keywordToCategoryMap)) {
    if (keywords.some(kw => queryLower.includes(kw))) {
      matched.push(category);
    }
  }

  if (matched.length > 0) {
    logger.debug('Category detection', { query, matched });
  } else {
    logger.debug('No category detected', { query });
  }

  return matched;
}

function extractKeywords(query) {
  const stopWords = [
    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    'cherche', 'veux', 'voudrais', 'recherche', 'acheter', 'trouver',
    'un', 'une', 'le', 'la', 'les', 'de', 'du', 'et', 'ou', 'à', 'pour',
    'rien', 'aucun', 'pas', 'ne', 'non', 'nul', 'vide',
    'je', 'suis', 'ai', 'ais', 'sont', 'est', 'était',
    'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de',
    'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'par', 'pour', 'vers',
    'ce', 'cet', 'cette', 'ces', 'mon', 'ta', 'son', 'sa', 'mes', 'tes', 'ses',
  ];

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w));

  return keywords;
}

/**
 * Valide si une requête est valide (pas juste des stop words)
 */
function isValidQuery(query) {
  if (!query || query.trim().length < 2) return false;
  
  const keywords = extractKeywords(query);
  
  // Si aucun mot-clé pertinent après suppression des stop words
  if (keywords.length === 0) return false;
  
  // Si la requête contient des mots "négatifs"
  const negativeWords = ['rien', 'aucun', 'pas', 'non', 'vide', 'nul'];
  if (negativeWords.some(word => query.toLowerCase().includes(word))) {
    return false;
  }
  
  // Rejeter les requêtes qui sont juste du bruit (répétitions, non-mots)
  const hasVowels = /[aeiouy]/i.test(query);
  const hasRepeatingChars = /(.)\1{2,}/.test(query); // Plus de 2 caractères identiques
  
  if (!hasVowels || hasRepeatingChars) {
    logger.warn('Query rejected: noise detected', { query });
    return false;
  }
  
  return true;
}

// === EMBEDDINGS ===
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') return null;

  const cacheKey = `emb:${text.substring(0, 100)}`;
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    metrics.recordCacheHit();
    logger.debug('Embedding cache hit', { text: text.substring(0, 30) });
    return cached;
  }

  // Check persistent cache (Postgres) by content hash
  const textHash = crypto.createHash('sha1').update(text).digest('hex');
  try {
    const persisted = await getPersistedEmbeddingByHash(textHash);
    if (persisted) {
      const normed = normalizeEmbedding(persisted) || persisted;
      embeddingCache.set(cacheKey, normed);
      metrics.recordCacheHit();
      logger.debug('Persistent embedding cache hit', { text: text.substring(0, 30) });
      return normed;
    }
  } catch (err) {
    logger.debug('Persistent cache read error', { error: err.message });
  }

  try {
    // Priorité 1: Jina AI Embeddings API (free, fast, no auth needed for basic use)
    try {
      const embedding = await retryWithBackoff(async () => {
        const headers = {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        };
        
        if (process.env.JINA_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
        }
        
        const response = await axios.post(
          'https://api.jina.ai/v1/embeddings',
          {
            model: 'jina-embeddings-v2-base-en',
            input: [text]
          },
          {
            headers,
            timeout: 10000,
          }
        );
        
        if (response.data && response.data.data && response.data.data[0] && response.data.data[0].embedding) {
          return response.data.data[0].embedding;
        }
        throw new Error('Invalid Jina response format');
      }, 2);

      if (embedding && Array.isArray(embedding) && embedding.length > 0) {
        const normed = normalizeEmbedding(embedding);
        // persist
        try { await setPersistedEmbedding(textHash, text, normed); } catch (e) { /* ignore */ }
        embeddingCache.set(cacheKey, normed);
        metrics.recordEmbedding(true);
        logger.debug('Jina embedding generated', { text: text.substring(0, 30), dim: embedding.length, normalizedDim: normed.length });
        return normed;
      }
    } catch (jinaErr) {
      logger.warn('Jina API failed (trying Replicate)', { error: jinaErr.message });
    }

    // Priorité 2: Replicate API
    if (process.env.REPLICATE_API_KEY) {
      try {
        const embedding = await retryWithBackoff(async () => {
          const response = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
              version: 'e5-base',
              input: { text_input: text }
            },
            {
              headers: {
                Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );
          
          if (response.data && response.data.output) {
            const output = response.data.output;
            if (Array.isArray(output) && output.length > 0) {
              return Array.isArray(output[0]) ? output[0] : output;
            }
            return output;
          }
          throw new Error('Invalid Replicate response format');
        }, 2);

        if (embedding && Array.isArray(embedding)) {
          const normed = normalizeEmbedding(embedding);
          try { await setPersistedEmbedding(textHash, text, normed); } catch (e) {}
          embeddingCache.set(cacheKey, normed);
          metrics.recordEmbedding(true);
          logger.debug('Replicate embedding generated', { text: text.substring(0, 30), dim: embedding.length, normalizedDim: normed.length });
          return normed;
        }
      } catch (replErr) {
        logger.warn('Replicate API failed (trying Ollama)', { error: replErr.message });
      }
    }

    // Priorité 3: Ollama (local)
    if (process.env.OLLAMA_HOST) {
      try {
        const embedding = await retryWithBackoff(async () => {
          const response = await axios.post(
            `${process.env.OLLAMA_HOST}/api/embed`,
            { model: 'nomic-embed-text', prompt: text },
            { timeout: 10000 }
          );
          return response.data.embedding || null;
        }, 2);

        if (embedding) {
          const normed = normalizeEmbedding(embedding);
          try { await setPersistedEmbedding(textHash, text, normed); } catch (e) {}
          embeddingCache.set(cacheKey, normed);
          metrics.recordEmbedding(true);
          logger.debug('Ollama embedding generated', { text: text.substring(0, 30), normalizedDim: normed.length });
          return normed;
        }
      } catch (olErr) {
        logger.warn('Ollama embedding also failed (using fallback)', { error: olErr.message });
      }
    }

    // FALLBACK: Local embedding generation (deterministic hash-based)
    // ⚠️ NOTE: This produces reasonable vectors but may have lower quality
    logger.info('Using local fallback embedding', { text: text.substring(0, 30) });
    const fallbackEmb = generateSimpleEmbedding(text);
    try { await setPersistedEmbedding(textHash, text, fallbackEmb); } catch (e) {}
    embeddingCache.set(cacheKey, fallbackEmb);
    metrics.recordEmbedding(true);
    return fallbackEmb;
  } catch (error) {
    logger.error('generateEmbedding fatal', { error: error.message });
    metrics.recordEmbedding(false);
    return null;
  }
}

function generateSimpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(EMBEDDING_DIMENSION).fill(0);

  for (const word of words) {
    const hash = hashCode(word);
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      embedding[i] += Math.sin((hash + i) * 0.5) * 0.1;
    }
  }

  const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
  return norm > 0 ? embedding.map(x => x / norm) : embedding;
}

// Ensure embeddings have the expected dimension and are unit-normalized.
function normalizeEmbedding(raw) {
  if (!raw || !Array.isArray(raw)) return null;
  const arr = raw.map(n => Number(n) || 0);
  const len = arr.length;
  const target = EMBEDDING_DIMENSION;

  let out = new Array(target).fill(0);

  if (len === target) {
    out = arr.slice();
  } else if (len > target) {
    // Downsample by averaging blocks
    const block = Math.floor(len / target);
    for (let j = 0; j < target; j++) {
      const start = j * block;
      const end = (j === target - 1) ? len : start + block;
      let sum = 0;
      let count = 0;
      for (let k = start; k < end && k < len; k++) {
        sum += arr[k];
        count++;
      }
      out[j] = count > 0 ? sum / count : 0;
    }
  } else {
    // Pad with zeros
    for (let i = 0; i < len; i++) out[i] = arr[i];
  }

  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0));
  if (norm > 0) return out.map(v => v / norm);
  return out;
}

// --- Persistent embeddings in Postgres (Supabase) ---
async function ensureEmbeddingsTable() {
  try {
    const { query: dbQuery } = await import('../db.js');
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS product_embeddings (
        content_hash TEXT PRIMARY KEY,
        text_content TEXT,
        embedding JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);
  } catch (err) {
    logger.debug('ensureEmbeddingsTable failed', { error: err.message });
  }
}

async function getPersistedEmbeddingByHash(hash) {
  try {
    if (!hash) return null;
    await ensureEmbeddingsTable();
    const { query: dbQuery } = await import('../db.js');
    const res = await dbQuery(`SELECT embedding FROM product_embeddings WHERE content_hash = $1 LIMIT 1`, [hash]);
    return res.rows && res.rows[0] ? res.rows[0].embedding : null;
  } catch (err) {
    logger.debug('getPersistedEmbeddingByHash failed', { error: err.message });
    return null;
  }
}

async function setPersistedEmbedding(hash, text, embedding) {
  try {
    if (!hash) return;
    await ensureEmbeddingsTable();
    const { query: dbQuery } = await import('../db.js');
    const embeddingJson = typeof embedding === 'string' ? embedding : JSON.stringify(embedding || []);
    await dbQuery(
      `INSERT INTO product_embeddings (content_hash, text_content, embedding, updated_at) VALUES ($1, $2, $3::jsonb, now()) ON CONFLICT (content_hash) DO UPDATE SET text_content = EXCLUDED.text_content, embedding = EXCLUDED.embedding, updated_at = now()`,
      [hash, text, embeddingJson]
    );
  } catch (err) {
    logger.debug('setPersistedEmbedding failed', { error: err.message });
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const hash32 = str.charCodeAt(i);
    hash = (hash << 5) - hash + hash32;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// === SIMILARITÉ COSINUS OPTIMISÉE ===
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA * normB);
  return magnitude > 0 ? dot / magnitude : 0;
}

// === RECHERCHE SÉMANTIQUE ===
export async function semanticSearch(query, detectedCategories = null, limit = 8) {
  const startTime = Date.now();
  try {
    logger.info('Semantic search start', { query, categories: detectedCategories?.length });
    
    // Cache lookup
    const cacheKey = `search:semantic:${query}:${Array.isArray(detectedCategories) ? detectedCategories.join(',') : ''}`;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      metrics.recordCacheHit();
      logger.debug('Search cache hit');
      return cached;
    }

    // 1: Générer embedding query
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length === 0) {
      logger.warn('Failed to generate query embedding');
      return { results: [], source: 'none' };
    }

    // 2: Récupérer produits PRÉ-INDEXÉS
    const { query: dbQuery } = await import('../db.js');
    
    let sqlQuery = `SELECT 
      p.id, 
      p.title as name,
      c.name as category,
      p.price, 
      p.description, 
      p.image_url,
      p.embedding
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.embedding IS NOT NULL`;
    
    const params = [];
    // IMPORTANT: Si catégories détectées, filtrer STRICTEMENT
    // Sinon, rechercher dans TOUS les produits
    if (detectedCategories && Array.isArray(detectedCategories) && detectedCategories.length > 0) {
      sqlQuery += ` AND c.name IN (${detectedCategories.map((_, i) => `$${i + 1}`).join(', ')})`;
      params.push(...detectedCategories);
      logger.debug('Filtering by detected categories', { categories: detectedCategories });
    } else {
      logger.debug('No category filter - searching all products');
    }
    
    sqlQuery += ` LIMIT 1000`;

    const result = await dbQuery(sqlQuery, params);
    const products = result.rows || [];
    logger.debug('Products loaded', { count: products.length, filtered: detectedCategories?.length > 0 });

    if (products.length === 0) {
      logger.info('No products found');
      return { results: [], source: 'none' };
    }

    // 3: Calculer similarité (OPTIMISÉ)
    const keywords = extractKeywords(query);

    const scored = products
      .map((product) => {
        let score = 0;

        let productEmbedding = product.embedding;
        if (typeof productEmbedding === 'string') {
          try {
            productEmbedding = JSON.parse(productEmbedding);
          } catch (e) {
            productEmbedding = null;
          }
        }

        if (productEmbedding && Array.isArray(productEmbedding) && productEmbedding.length === queryEmbedding.length) {
          score = cosineSimilarity(queryEmbedding, productEmbedding) || 0;
        }

        // Textual keyword boost: favors items whose title/category/description contain query keywords
        const textFields = `${product.name || ''} ${product.category || ''} ${product.description || ''}`.toLowerCase();
        let textMatches = 0;
        for (const kw of keywords) {
          if (kw && textFields.includes(kw)) textMatches++;
        }
        const textBoostRatio = keywords.length > 0 ? (textMatches / keywords.length) : 0;

        // Exact phrase boost
        const exactPhrase = query.toLowerCase().trim();
        const hasExact = exactPhrase && textFields.includes(exactPhrase) ? 1 : 0;

        // Combine cosine score with textual signals. Weighted to keep semantic relevance primary
        const combined = Math.min(1, (score * 0.80) + (textBoostRatio * 0.18) + (hasExact * 0.15));

        return { ...product, score: combined };
      })
      .sort((a, b) => b.score - a.score);
    
    // DEBUG: Log top scores before filtering
    logger.debug('Top scores before filtering', {
      top3: scored.slice(0, 3).map(p => ({ name: p.name, score: p.score.toFixed(4) }))
    });

    // Relax thresholds to tolerate fallback embeddings and typos.
    // Also fix category comparison: product row contains `category` (name), not `category_id`.
    const SCORE_THRESHOLD_WITH_CATEGORY = 0.65;
    const SCORE_THRESHOLD_NO_CATEGORY = 0.60;

    const filtered = scored
      .filter(p => {
        if (detectedCategories && Array.isArray(detectedCategories) && detectedCategories.length > 0) {
          // Match category name (case-insensitive)
          const prodCat = (p.category || '').toString().toLowerCase();
          const matched = detectedCategories.map(c => c.toString().toLowerCase()).includes(prodCat);
          return matched && p.score >= SCORE_THRESHOLD_WITH_CATEGORY;
        }
        return p.score >= SCORE_THRESHOLD_NO_CATEGORY;
      })
      .slice(0, limit);

    let response;
    if (filtered.length > 0) {
      response = {
        results: filtered,
        source: 'semantic',
        bestScore: filtered[0]?.score || 0,
        hasLowRelevance: false,
      };
    } else if (scored.length > 0) {
      // No items passed the strict filter, but we have scored candidates.
      // Return top scored items as a low-relevance fallback so the user sees something
      // instead of an empty result set (more forgiving like Google).
      const fallback = scored.slice(0, limit);
      response = {
        results: fallback,
        source: 'semantic',
        bestScore: fallback[0]?.score || 0,
        hasLowRelevance: true,
        note: 'fallback_top_scored'
      };
    } else {
      response = { results: [], source: 'none' };
    }

    // Prioritize and limit results before caching/returning
    response.results = prioritizeAndLimit(response.results, query, detectedCategories, limit);
    searchCache.set(cacheKey, response);
    const elapsed = Date.now() - startTime;
    metrics.recordSearch('semantic', elapsed);
    logger.info('Semantic search finished', { loaded: scored.length, returned: response.results.length, elapsed, lowRelevance: !!response.hasLowRelevance });

    return response;
  } catch (error) {
    logger.error('Semantic search error', { error: error.message });
    return { results: [], source: 'none' };
  }
}

// Prioritize results that match detected category or query keywords and limit the output
function prioritizeAndLimit(results, query, detectedCategories, limit) {
  if (!Array.isArray(results) || results.length === 0) return [];

  const keywords = extractKeywords(query);

  const annotated = results.map(p => {
    const textFields = `${p.name || ''} ${p.title || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
    let matchCount = 0;
    for (const kw of keywords) if (kw && textFields.includes(kw)) matchCount++;
    const categoryMatch = Array.isArray(detectedCategories) && detectedCategories.length > 0
      ? detectedCategories.map(c => c.toString().toLowerCase()).includes((p.category || '').toString().toLowerCase())
      : false;
    const exactPhrase = query.toLowerCase().trim();
    const exactMatch = exactPhrase && textFields.includes(exactPhrase);
    return { ...p, _matchCount: matchCount, _categoryMatch: categoryMatch ? 1 : 0, _exactMatch: exactMatch ? 1 : 0 };
  });

  // Sort: exactMatch, categoryMatch, matchCount, score
  annotated.sort((a, b) => {
    if (b._exactMatch !== a._exactMatch) return b._exactMatch - a._exactMatch;
    if (b._categoryMatch !== a._categoryMatch) return b._categoryMatch - a._categoryMatch;
    if ((b._matchCount || 0) !== (a._matchCount || 0)) return (b._matchCount || 0) - (a._matchCount || 0);
    return (b.score || 0) - (a.score || 0);
  });

  return annotated.slice(0, limit).map(({ _matchCount, _categoryMatch, _exactMatch, ...rest }) => rest);
}

// === RECHERCHE MEILISEARCH ===
export async function vectorSearch(query, category = null, limit = 8) {
  try {
    const ms = initMeilisearch();
    const index = ms.index('products');
    
    logger.debug('Meilisearch query', { query, limit });
    const searchOptions = { limit };
    if (category) {
      // Meilisearch filter expects exact match on filterable attribute
      searchOptions.filter = `category = "${category}"`;
    }
    const results = await index.search(query, searchOptions);
    const hits = results.hits || [];
    
    if (hits.length > 0) {
      logger.info('Meilisearch results', { count: hits.length });
      const best = hits[0]?._rankingScore || 0;
      const final = prioritizeAndLimit(hits.slice(0, limit), query, category, limit);
      return {
        results: final,
        hasLowRelevance: best < 0.5,
        bestScore: best,
      };
    }
    
    logger.info('Meilisearch no results', { query });
    return { results: [], hasLowRelevance: true };
  } catch (error) {
    logger.error('Meilisearch error', { error: error.message });
    return { results: [], hasLowRelevance: true };
  }
}

// Simple keyword/text fallback using SQL ILIKE to tolerate typos and partial matches
export async function keywordSearch(query, category = null, limit = 8) {
  try {
    const { query: dbQuery } = await import('../db.js');

    const pattern = `%${query.replace(/%/g, '')}%`;
    let sql = `SELECT p.id, p.title as name, c.name as category, p.price, p.description, p.image_url FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE (p.title ILIKE $1 OR p.description ILIKE $1 OR c.name ILIKE $1)`;
    const params = [pattern];
    if (category) {
      sql += ` AND c.name ILIKE $2`;
      params.push(`%${category}%`);
    }
    sql += ` LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await dbQuery(sql, params);
    const rows = res.rows || [];
    // Very simple scoring: not normalized, but usable as fallback
    const scored = rows.map(r => ({ ...r, score: 0.5 }));
    const final = prioritizeAndLimit(scored.slice(0, limit), query, category, limit);
    return { results: final, bestScore: final[0]?.score || scored[0]?.score || 0 };
  } catch (error) {
    logger.warn('Keyword search failed', { error: error.message });
    return { results: [], bestScore: 0 };
  }
}

// === RECHERCHE INTELLIGENTE CASCADE ===
export async function smartSearch(query, category = null, limit = 8) {
  const startTime = Date.now();
  
  // Valider la requête
  if (!isValidQuery(query)) {
    logger.warn('Invalid query', { query, reason: 'No meaningful keywords' });
    return {
      results: [],
      source: 'none',
      hasLowRelevance: true,
      message: 'Veuillez préciser votre recherche (ex: "un sac bleu", "chaussures")',
    };
  }

  logger.info('Smart search start', { query });
  
  let targetCategories = category || extractCategoryFromQuery(query);
  // 1️⃣ SÉMANTIQUE (priorité ABSOLUE)
  logger.debug('Step 1: Semantic search');
  const semanticResult = await semanticSearch(query, targetCategories, limit);
  if (semanticResult.results.length > 0) {
    const elapsed = Date.now() - startTime;
    metrics.recordSearch('semantic', elapsed);
    logger.info('Smart search result', { source: 'semantic', results: semanticResult.results.length, elapsed });
    return {
      results: semanticResult.results.slice(0, limit),
      source: 'semantic',
      hasLowRelevance: !!semanticResult.hasLowRelevance,
    };
  }

  // 2️⃣ Fallback Meilisearch (typo-tolerant, text-based and filterable)
  logger.debug('Step 2: Meilisearch fallback');
  const categoryFilter = Array.isArray(targetCategories) ? targetCategories[0] : targetCategories;
  const meiliResult = await vectorSearch(query, categoryFilter, limit);
  if (meiliResult.results && meiliResult.results.length > 0) {
    const elapsed = Date.now() - startTime;
    metrics.recordSearch('meilisearch', elapsed);
    logger.info('Smart search result (meilisearch)', { results: meiliResult.results.length, elapsed });
    return {
      results: meiliResult.results.slice(0, limit),
      source: 'meilisearch',
      hasLowRelevance: !!meiliResult.hasLowRelevance,
    };
  }

  // 3️⃣ Keyword SQL fallback (ILIKE) to tolerate partial matches / small typos
  logger.debug('Step 3: Keyword SQL fallback');
  const keywordResult = await keywordSearch(query, categoryFilter, limit);
  if (keywordResult.results && keywordResult.results.length > 0) {
    const elapsed = Date.now() - startTime;
    metrics.recordSearch('meilisearch_keyword', elapsed);
    logger.info('Smart search result (keyword SQL)', { results: keywordResult.results.length, elapsed });
    return {
      results: keywordResult.results.slice(0, limit),
      source: 'keyword',
      hasLowRelevance: false,
    };
  }

  // Nothing found after fallbacks
  const elapsed = Date.now() - startTime;
  logger.warn('No results after semantic and fallback searches', { query, elapsed });
  return {
    results: [],
    source: 'none',
    hasLowRelevance: true,
    message: 'Aucun résultat — essayez d\'affiner ou d\'utiliser d\'autres mots-clés.'
  };
}

// === INDEXATION BATCH ===
export async function indexProductsBatch(products) {
  try {
    const { query: dbQuery } = await import('../db.js');

    logger.info('Batch indexing start', { count: products.length });
    
    const indexed = await Promise.all(
      products.map(async product => {
        const textToEmbed = [
          product.name || product.title,
          product.category,
          product.description || '',
        ]
          .filter(Boolean)
          .join(' ');

        const contentHash = crypto.createHash('sha1').update(textToEmbed).digest('hex');

        // Try persistent cache first to avoid regenerating
        let embedding = await getPersistedEmbeddingByHash(contentHash);
        if (embedding) {
          logger.debug('Using persisted embedding for product', { id: product.id });
        } else {
          embedding = await generateEmbedding(textToEmbed);
          if (embedding) {
            try { await setPersistedEmbedding(contentHash, textToEmbed, embedding); } catch (e) {}
          }
        }

        if (embedding) {
          try {
            const toStore = normalizeEmbedding(embedding) || embedding;
            await dbQuery(
              `UPDATE products SET embedding = $1 WHERE id = $2`,
              [JSON.stringify(toStore), product.id]
            );
          } catch (error_) {
            logger.warn(`Embedding update failed for product ${product.id}`, { error: error_.message });
          }
        }

        return {
          id: product.id,
          name: product.name || product.title,
          category: (product.category || 'general').toLowerCase(),
          price: product.price || 0,
          image_url: product.image_url || product.image,
          description: product.description || '',
          searchKeywords: textToEmbed.toLowerCase(),
          createdAt: new Date().toISOString(),
          embedding: embedding ? JSON.stringify(normalizeEmbedding(embedding) || embedding) : null,
        };
      })
    );

    logger.info('Embeddings indexed', { count: indexed.length });
    
    try {
      const ms = initMeilisearch();
      const index = ms.index('products');
      await index.addDocuments(indexed.map(p => ({ ...p, embedding: undefined })));
      logger.info('Meilisearch indexed', { count: indexed.length });
    } catch (error_) {
      logger.warn('Meilisearch indexing failed', { error: error_.message });
    }

    return indexed;
  } catch (error) {
    logger.error('Batch indexing error', { error: error.message });
    return products;
  }
}

export async function setupMeilisearchIndex() {
  try {
    const ms = initMeilisearch();

    try {
      await ms.createIndex('products', { primaryKey: 'id' });
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    const index = ms.index('products');

    await index.updateFilterableAttributes([
      'category',
      'price',
      'createdAt',
    ]);

    await index.updateSearchableAttributes([
      'name',
      'category',
      'description',
      'searchKeywords',
    ]);

    logger.info('Meilisearch index ready');
    return index;
  } catch (error) {
    logger.warn('Meilisearch setup failed', { error: error.message });
    return null;
  }
}

// === HEALTH & MONITORING ===
export function getHealthStatus() {
  return {
    embeddings: {
      cache: embeddingCache.getStats(),
      metrics: {
        generations: metrics.data.embeddingGenerations,
        errors: metrics.data.embeddingErrors,
        errorRate: metrics.data.embeddingGenerations > 0
          ? (metrics.data.embeddingErrors / metrics.data.embeddingGenerations * 100).toFixed(2) + '%'
          : '0%',
      },
    },
    search: {
      cache: searchCache.getStats(),
      metrics: metrics.getReport(),
    },
    system: {
      uptime: Math.floor((Date.now() - metrics.data.startedAt) / 1000),
      memoryUsage: process.memoryUsage(),
    },
  };
}

export function debugEmbedding(text) {
  const simple = generateSimpleEmbedding(text);
  return {
    text,
    dimension: simple.length,
    sample: simple.slice(0, 10),
    norm: Math.sqrt(simple.reduce((s, x) => s + x * x, 0)),
  };
}

export function clearCache() {
  embeddingCache.clear();
  searchCache.clear();
  logger.info('Caches cleared');
}

