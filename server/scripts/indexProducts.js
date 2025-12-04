/**
 * Script pour indexer les produits dans Meilisearch
 * Utilisation: node scripts/indexProducts.js
 */

const axios = require('axios');
require('dotenv').config();

const API_ROOT = process.env.API_ROOT || 'http://localhost:3000/api';

/**
 * Récupère tous les produits depuis votre API/DB
 */
async function getAllProducts() {
  try {
    // Adapter cette fonction à votre source de données
    const response = await axios.get(`${API_ROOT}/products?limit=1000`);
    return response.data.products || response.data || [];
  } catch (error) {
    console.error('❌ Erreur récupération produits:', error.message);
    return [];
  }
}

/**
 * Index les produits dans Meilisearch
 */
async function indexProducts() {
  try {
    console.log('🔄 Récupération des produits...');
    const products = await getAllProducts();

    if (products.length === 0) {
      console.log('⚠️ Aucun produit trouvé');
      return;
    }

    console.log(`📦 ${products.length} produits trouvés`);

    // Envoyer pour indexation
    console.log('📤 Envoi pour indexation...');
    const response = await axios.post(`${API_ROOT}/index-products`, {
      products,
    });

    console.log('✅ Indexation réussie!');
    console.log(response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Lancer l'indexation
console.log('🚀 Démarrage de l\'indexation des produits...\n');
indexProducts();
