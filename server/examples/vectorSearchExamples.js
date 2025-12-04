/**
 * Exemples pratiques d'utilisation de la recherche vectorielle
 * Ces exemples montrent comment utiliser les différentes fonctionnalités
 */

// ============================================
// 📌 EXEMPLE 1: Indexer vos produits
// ============================================

const axios = require('axios');
const API_ROOT = 'http://localhost:3000/api';

/**
 * Indexer des produits dans Meilisearch
 */
async function example1_indexProducts() {
  const products = [
    {
      id: 1,
      name: 'Sac à main en cuir rouge',
      category: 'sac',
      price: 4500,
      description: 'Sac à main élégant en cuir véritable, capacité 20L, fermeture éclair',
      image_url: '/images/sac-1.jpg',
    },
    {
      id: 2,
      name: 'Sac de voyage pratique',
      category: 'sac',
      price: 5500,
      description: 'Sac de voyage spacieux avec compartiments, 40L',
      image_url: '/images/sac-2.jpg',
    },
    {
      id: 3,
      name: 'Lampe de bureau LED',
      category: 'lampe',
      price: 2500,
      description: 'Lampe LED dimmable, 3 niveaux de luminosité, économe en énergie',
      image_url: '/images/lampe-1.jpg',
    },
    {
      id: 4,
      name: 'Table en bois massif',
      category: 'table',
      price: 8500,
      description: 'Table robuste en chêne massif, 120x80 cm',
      image_url: '/images/table-1.jpg',
    },
  ];

  try {
    const response = await axios.post(`${API_ROOT}/index-products`, {
      products,
    });
    console.log('✅ Produits indexés:', response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// ============================================
// 📌 EXEMPLE 2: Recherche simple
// ============================================

/**
 * Effectuer une recherche vectorielle simple
 */
async function example2_simpleSearch() {
  try {
    const response = await axios.post(`${API_ROOT}/vector-search`, {
      query: 'Je cherche un sac pratique',
      limit: 4,
    });

    console.log('🔍 Résultats de recherche:');
    console.log('Query:', response.data.query);
    console.log('Catégorie détectée:', response.data.category);
    console.log('Nombre de résultats:', response.data.results.length);
    console.log('Pertinence:', response.data.hasLowRelevance ? 'Faible' : 'Haute');

    response.data.results.forEach((product, idx) => {
      console.log(`\n${idx + 1}. ${product.name}`);
      console.log(`   Prix: ${product.price} FCFA`);
      console.log(`   Score: ${(product.similarityScore * 100).toFixed(1)}%`);
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// ============================================
// 📌 EXEMPLE 3: Hard Filtering - Catégories
// ============================================

/**
 * Recherche avec hard filter par catégorie
 */
async function example3_hardFiltering() {
  const queries = [
    { q: 'Je cherche un sac bleu', category: 'sac' },
    { q: 'Lampe pour mon bureau', category: 'lampe' },
    { q: 'Table de salle à manger', category: 'table' },
  ];

  for (const query of queries) {
    try {
      const response = await axios.post(`${API_ROOT}/vector-search`, {
        query: query.q,
        category: query.category, // Force la catégorie
        limit: 2,
      });

      console.log(`\n🎯 Recherche: "${query.q}" (catégorie: ${query.category})`);
      console.log(`Résultats trouvés: ${response.data.results.length}`);

      if (response.data.results.length === 0) {
        console.log('⚠️ Aucun produit trouvé dans cette catégorie');
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }
}

// ============================================
// 📌 EXEMPLE 4: No Match Detection
// ============================================

/**
 * Gérer les cas où aucun produit pertinent n'est trouvé
 */
async function example4_noMatchDetection() {
  const problematicQueries = [
    'Je cherche un sac téléportable',
    'Lampe invisible',
    'Table flottante',
  ];

  for (const query of problematicQueries) {
    try {
      const response = await axios.post(`${API_ROOT}/vector-search`, {
        query,
        limit: 4,
      });

      console.log(`\n⚠️ Query: "${query}"`);
      console.log(`Résultats: ${response.data.results.length}`);
      console.log(`Pertinence: ${response.data.hasLowRelevance ? 'FAIBLE ❌' : 'BONNE ✅'}`);

      if (response.data.hasLowRelevance && response.data.results.length === 0) {
        console.log('💡 Action recommandée: Afficher alternatives générales');
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }
}

// ============================================
// 📌 EXEMPLE 5: Frontend Integration
// ============================================

/**
 * Comment intégrer dans React (voir ChatPopup.tsx)
 */
const frontendExample = `
// Dans ChatPopup.tsx

const vectorSearch = async (query: string, detectedCategory?: string | null) => {
  try {
    const response = await axios.post(\`\${API_ROOT}/api/vector-search\`, {
      query: query.trim(),
      category: detectedCategory || null,
      limit: 8,
    });

    return {
      results: response.data.results || [],
      hasLowRelevance: response.data.hasLowRelevance,
      category: response.data.category,
    };
  } catch (error) {
    return {
      results: [],
      hasLowRelevance: true,
      category: null,
    };
  }
};

// Dans sendMessage()
const detectedCategory = detectCategory(input);
const searchResult = await vectorSearch(input, detectedCategory);

if (searchResult.results.length === 0) {
  // Cas: Aucun résultat
  botMessage = "Je n'ai rien trouvé de vraiment proche. Voici quelques alternatives.";
} else if (searchResult.hasLowRelevance) {
  // Cas: Résultats peu pertinents
  botMessage = "Résultats peu pertinents. Voici quelques alternatives.";
} else {
  // Cas: Résultats pertinents
  botMessage = \`J'ai trouvé \${searchResult.results.length} produit(s) ultra pertinent(s) !\`;
}
`;

// ============================================
// 📌 EXEMPLE 6: Monitoring et Logging
// ============================================

/**
 * Logger les statistiques de recherche
 */
async function example6_monitoring() {
  const searchStats = {
    totalQueries: 0,
    successfulQueries: 0,
    lowRelevanceQueries: 0,
    emptyResultQueries: 0,
    averageScore: 0,
  };

  const logSearch = (query, result) => {
    searchStats.totalQueries++;

    if (result.results.length === 0) {
      searchStats.emptyResultQueries++;
    } else if (result.hasLowRelevance) {
      searchStats.lowRelevanceQueries++;
    } else {
      searchStats.successfulQueries++;
    }
  };

  // Exemple d'utilisation
  const results = [
    {
      query: 'Sac rouge',
      results: [{ id: 1, name: 'Sac 1' }],
      hasLowRelevance: false,
    },
    {
      query: 'Produit inexistant',
      results: [],
      hasLowRelevance: true,
    },
  ];

  results.forEach((r) => logSearch(r.query, r));

  console.log('\n📊 Statistiques de recherche:');
  console.log(`Total: ${searchStats.totalQueries}`);
  console.log(`Succès: ${searchStats.successfulQueries} (${((searchStats.successfulQueries / searchStats.totalQueries) * 100).toFixed(1)}%)`);
  console.log(`Faible pertinence: ${searchStats.lowRelevanceQueries}`);
  console.log(`Aucun résultat: ${searchStats.emptyResultQueries}`);
}

// ============================================
// 📌 EXEMPLE 7: Performance Testing
// ============================================

/**
 * Tester la performance de la recherche vectorielle
 */
async function example7_performanceTesting() {
  const queries = [
    'Sac à main',
    'Lampe LED',
    'Table en bois',
    'Canapé confortable',
    'Décoration murale',
  ];

  console.log('\n⏱️ Test de performance:');

  for (const query of queries) {
    try {
      const start = Date.now();

      const response = await axios.post(`${API_ROOT}/vector-search`, {
        query,
        limit: 8,
      });

      const duration = Date.now() - start;

      console.log(`\n"${query}"`);
      console.log(`Durée: ${duration}ms`);
      console.log(`Résultats: ${response.data.results.length}`);
      console.log(`Meilleur score: ${(response.data.results[0]?.similarityScore * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }
}

// ============================================
// 📌 LANCER LES EXEMPLES
// ============================================

async function runAllExamples() {
  console.log('🚀 Lancement des exemples...\n');

  await example1_indexProducts();
  console.log('\n' + '='.repeat(50));

  await example2_simpleSearch();
  console.log('\n' + '='.repeat(50));

  await example3_hardFiltering();
  console.log('\n' + '='.repeat(50));

  await example4_noMatchDetection();
  console.log('\n' + '='.repeat(50));

  example6_monitoring();
  console.log('\n' + '='.repeat(50));

  await example7_performanceTesting();

  console.log('\n✅ Exemples terminés!');
}

// Décommenter pour lancer
// runAllExamples();

// Export pour utilisation en module
module.exports = {
  example1_indexProducts,
  example2_simpleSearch,
  example3_hardFiltering,
  example4_noMatchDetection,
  example6_monitoring,
  example7_performanceTesting,
};
