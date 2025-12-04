#!/usr/bin/env node

/**
 * Script pour indexer les produits dans Meilisearch
 * Usage: node scripts/initVectorSearch.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_ROOT = process.env.API_ROOT || 'http://localhost:3000/api';

/**
 * Récupère tous les produits
 */
async function getProducts() {
  try {
    const response = await axios.get(`${API_ROOT.replace('/api', '')}/api/products?limit=1000`);
    return response.data.products || response.data || [];
  } catch (error) {
    console.error('❌ Erreur récupération produits:', error.message);
    return [];
  }
}

/**
 * Index les produits
 */
async function indexProducts() {
  try {
    console.log('🔄 Récupération des produits...');
    const products = await getProducts();

    if (products.length === 0) {
      console.log('⚠️ Aucun produit trouvé');
      return;
    }

    console.log(`📦 ${products.length} produits trouvés`);
    console.log('📤 Indexation en cours...');

    const response = await axios.post(`${API_ROOT}/index-products`, {
      products,
    });

    console.log('✅ Indexation réussie!');
    console.log(`   ${response.data.count} produits indexés`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Démarrage indexation vectorielle...\n');
indexProducts();
