// nlp/recommend.js
// Local heuristic-based product recommendations
// NOTE: Vector search now uses Meilisearch + Embeddings (see server/src/services/embeddings.js)
// This file provides fallback local recommendations only
import dotenv from 'dotenv'
dotenv.config()

const localRecommend = (userProfile = {}, userMessage = '') => {
  const { preferences = [], budget } = userProfile;
  const message = (userMessage || '').toLowerCase();
  
  // Base de données de produits locale (fallback)
  const products = [
    { id: 1, name: 'Lampe Scandinave Blanche', price: 89.99, category: 'décoration' },
    { id: 2, name: 'Chaise Design Eiffel', price: 129.99, category: 'mobilier' },
    { id: 3, name: 'Table Basse Bois Naturel', price: 199.99, category: 'mobilier' },
    { id: 4, name: 'Canapé 3 Places Velours', price: 899.99, category: 'mobilier' },
    { id: 5, name: 'Vase Céramique Artisanal', price: 45.99, category: 'décoration' }
  ];

  let filteredProducts = [...products];

  // Filtrage par mots-clés dans le message
  if (message.includes('lampe') || message.includes('luminaire')) {
    filteredProducts = filteredProducts.filter(p => p.category === 'décoration');
  } else if (message.includes('chaise') || message.includes('siège')) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes('chaise'));
  } else if (message.includes('table')) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes('table'));
  } else if (message.includes('canapé') || message.includes('sofa')) {
    filteredProducts = filteredProducts.filter(p => p.category === 'mobilier' && p.name.toLowerCase().includes('canapé'));
  }

  // Filtrage par budget
  if (budget) {
    filteredProducts = filteredProducts.filter(p => p.price <= budget);
  }

  return filteredProducts.slice(0, 3);
}

const recommend = async (userProfile = {}, userMessage = '') => {
  // All vector search is now handled by /api/vector-search endpoint
  // This provides fallback local recommendations only
  return localRecommend(userProfile, userMessage)
}

export default recommend;