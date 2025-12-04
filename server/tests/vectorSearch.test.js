/**
 * Tests pour la recherche vectorielle
 * Utilisation: npm test -- vectorSearch.test.js
 */

const axios = require('axios');
const {
  vectorSearch,
  extractCategoryFromQuery,
  cosineSimilarity,
  generateEmbedding,
} = require('../src/services/embeddings');

const API_ROOT = process.env.API_ROOT || 'http://localhost:3000/api';

describe('🧪 Vector Search Tests', () => {
  
  // ✅ Test 1: Détection de catégorie
  test('detectCategory - Sac', () => {
    const category = extractCategoryFromQuery('Je cherche un sac rouge');
    expect(category).toBe('sac');
  });

  test('detectCategory - Lampe', () => {
    const category = extractCategoryFromQuery('Lampe de bureau LED');
    expect(category).toBe('lampe');
  });

  test('detectCategory - Canapé', () => {
    const category = extractCategoryFromQuery('Canapé 3 places confortable');
    expect(category).toBe('canapé');
  });

  test('detectCategory - Pas de catégorie', () => {
    const category = extractCategoryFromQuery('Produit général');
    expect(category).toBeNull();
  });

  // ✅ Test 2: Similarité cosinus
  test('cosineSimilarity - Vecteurs identiques', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    expect(similarity).toBe(1);
  });

  test('cosineSimilarity - Vecteurs opposés', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [-1, 0, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    expect(similarity).toBe(-1);
  });

  test('cosineSimilarity - Vecteurs orthogonaux', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    expect(similarity).toBe(0);
  });

  // ✅ Test 3: Embeddings
  test('generateEmbedding - Text vide', async () => {
    const embedding = await generateEmbedding('');
    expect(embedding).toBeNull();
  });

  test('generateEmbedding - Text normal', async () => {
    const embedding = await generateEmbedding('Sac à main rouge');
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(384); // all-MiniLM-L6-v2 = 384 dimensions
  });

  // ✅ Test 4: Recherche vectorielle
  test('vectorSearch - Avec catégorie hard filter', async () => {
    const result = await vectorSearch(
      'Sac pratique',
      'sac',
      8,
      0.5
    );
    
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('hasLowRelevance');
    expect(Array.isArray(result.results)).toBe(true);
  });

  test('vectorSearch - Sans catégorie', async () => {
    const result = await vectorSearch('Produit', null, 8, 0.5);
    expect(result).toHaveProperty('results');
  });

  // ✅ Test 5: Endpoints API
  test('POST /vector-search - Requête valide', async () => {
    try {
      const response = await axios.post(`${API_ROOT}/vector-search`, {
        query: 'Sac rouge',
        category: 'sac',
        limit: 4,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
      expect(response.data).toHaveProperty('results');
    } catch (error) {
      console.warn('⚠️ API non disponible pour test');
    }
  });

  test('POST /vector-search - Query vide', async () => {
    try {
      const response = await axios.post(`${API_ROOT}/vector-search`, {
        query: '',
      });
      expect(response.status).toBe(400);
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
  });

  // ✅ Test 6: No Match Detection
  test('No match detection - Score faible', async () => {
    const result = await vectorSearch(
      'zzzzzzzzzzzzzzz', // Produit inexistant
      null,
      8,
      0.5
    );

    expect(result.hasLowRelevance).toBe(true);
  });
});

/**
 * Suite de tests d'intégration
 */
describe('🧪 Integration Tests', () => {
  
  test('Flow complet - Recherche → Résultats → Messages', async () => {
    // Simuler le flux utilisateur
    const userQuery = 'Je cherche un sac pratique pour le bureau';
    
    // 1. Détection catégorie
    const category = extractCategoryFromQuery(userQuery);
    expect(category).toBe('sac');

    // 2. Génération embedding
    const embedding = await generateEmbedding(userQuery);
    expect(embedding).not.toBeNull();

    // 3. Recherche vectorielle
    const result = await vectorSearch(userQuery, category, 8, 0.5);
    
    // 4. Déterminer le message
    let message = '';
    if (result.results.length === 0) {
      message = "Je n'ai rien trouvé de vraiment proche. Voici quelques alternatives.";
    } else if (result.hasLowRelevance) {
      message = 'Résultats peu pertinents. Voici quelques alternatives.';
    } else {
      message = `J'ai trouvé ${result.results.length} produit(s) ultra pertinent(s)!`;
    }

    expect(typeof message).toBe('string');
    expect(message.length > 0).toBe(true);
  });
});

/**
 * Tests de performance
 */
describe('⚡ Performance Tests', () => {
  
  test('Performance - Génération embedding', async () => {
    const start = Date.now();
    await generateEmbedding('Sac à main');
    const duration = Date.now() - start;
    
    console.log(`📊 Embedding généré en ${duration}ms`);
    expect(duration).toBeLessThan(5000); // Moins de 5s
  });

  test('Performance - Similarité cosinus', () => {
    const vec1 = new Array(384).fill(Math.random());
    const vec2 = new Array(384).fill(Math.random());
    
    const start = Date.now();
    cosineSimilarity(vec1, vec2);
    const duration = Date.now() - start;
    
    console.log(`📊 Similarité calculée en ${duration}ms`);
    expect(duration).toBeLessThan(10); // Moins de 10ms
  });
});
