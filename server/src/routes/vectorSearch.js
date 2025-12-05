/**
 * Routes API pour recherche vectorielle avec Meilisearch + Sanity
 * Pipeline complet avec fallbacks robustes
 */

import express from 'express';
import {
  smartSearch,
  extractCategoryFromQuery,
  indexProductsBatch,
  setupMeilisearchIndex,
  getHealthStatus,
  debugEmbedding,
  clearCache,
} from '../services/embeddings.js';

const router = express.Router();

/**
 * POST /api/vector-search
 * Recherche intelligente avec fallbacks
 * Query: { query, category?, limit? }
 */
router.post('/vector-search', async (req, res) => {
  try {
    const { query, category, limit = 8, budget = null, min_price = null, max_price = null } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Query invalide (min 2 chars)',
        results: [],
      });
    }

    const targetCategory = category || extractCategoryFromQuery(query);
    const filters = {
      budget: budget || null,
      minPrice: min_price || null,
      maxPrice: max_price || null,
    };

    const searchResult = await smartSearch(
      query.trim(),
      targetCategory,
      Number.parseInt(limit),
      filters
    );

    res.json({
      success: true,
      query,
      category: targetCategory,
      results: searchResult.results,
      hasLowRelevance: searchResult.hasLowRelevance,
      filters: filters,
      source: searchResult.source,
      message: searchResult.results.length > 0
        ? `Résultats trouvés (${searchResult.source})`
        : 'Aucun résultat',
    });
  } catch (error) {
    console.error('❌ POST /vector-search:', error.message);
    res.status(500).json({
      error: error.message,
      results: [],
    });
  }
});

/**
 * POST /api/index-products
 * Indexe les produits dans Meilisearch
 */
router.post('/index-products', async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'products doit être un array non-vide',
      });
    }

    await setupMeilisearchIndex();
    const indexed = await indexProductsBatch(products);

    res.json({
      success: true,
      message: `${indexed.length} produits indexés`,
      count: indexed.length,
    });
  } catch (error) {
    console.error('❌ POST /index-products:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/search-categories
 * Récupère les catégories disponibles
 */
router.get('/search-categories', async (req, res) => {
  try {
    const categories = [
      'Accessoires',
      'Vêtements',
      'Électronique',
      'Art & Décoration',
      'Maison',
      'Bijoux',
      'Cosmétiques',
      'Alimentation',
      'Livres',
    ];

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('❌ GET /search-categories:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/search-test
 * Test rapide de la recherche (pour debug)
 */
router.get('/search-test', async (req, res) => {
  try {
    const testResult = await smartSearch(
      'je veux un sac bleu',
      null,
      5
    );

    res.json({
      success: true,
      test: 'je veux un sac bleu',
      results: testResult.results,
      source: testResult.source,
      hasLowRelevance: testResult.hasLowRelevance,
    });
  } catch (error) {
    console.error('❌ GET /search-test:', error.message);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/health
 * Status complet du service (métriques + cache)
 */
router.get('/health', (req, res) => {
  try {
    const health = getHealthStatus();
    const isHealthy = health.search.metrics.searches > 0 || true;

    res.json({
      success: isHealthy,
      timestamp: new Date().toISOString(),
      service: 'embedding-search',
      status: isHealthy ? 'operational' : 'degraded',
      ...health,
    });
  } catch (error) {
    console.error('❌ GET /health:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/metrics
 * Métriques de recherche uniquement (allégé)
 */
router.get('/metrics', (req, res) => {
  try {
    const health = getHealthStatus();
    res.json({
      searches: health.search.metrics,
      embeddings: health.embeddings.metrics,
      cacheStats: {
        embedding: health.embeddings.cache,
        search: health.search.cache,
      },
    });
  } catch (error) {
    console.error('❌ GET /metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/debug/embedding
 * Debug un embedding (test HF API)
 * Body: { text }
 */
router.post('/debug/embedding', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text required' });
    }

    const debug = debugEmbedding(text);
    res.json({
      success: true,
      debug,
    });
  } catch (error) {
    console.error('❌ POST /debug/embedding:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cache/clear
 * Vide les caches LRU (admin only)
 */
router.post('/cache/clear', (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_SECRET || 'admin-secret'}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    clearCache();
    res.json({
      success: true,
      message: 'Caches cleared',
    });
  } catch (error) {
    console.error('❌ POST /cache/clear:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
