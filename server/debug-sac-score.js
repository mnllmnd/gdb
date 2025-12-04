import axios from 'axios';
import { query as dbQuery } from './src/db.js';

// Copy des fonctions d'embedding
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const hash32 = str.charCodeAt(i);
    hash = (hash << 5) - hash + hash32;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateSimpleEmbedding(text) {
  const EMBEDDING_DIMENSION = 384;
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

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitude = Math.sqrt(normA * normB);
  return magnitude > 0 ? dot / magnitude : 0;
}

console.log('🔍 Calculer scores réels:\n');

// Générer embedding pour "sac"
const queryEmb = generateSimpleEmbedding('sac');
console.log(`Query "sac" embedding: 384 dims (first 5: ${JSON.stringify(queryEmb.slice(0, 5))})\n`);

// Récupérer produit "Sac"
const result = await dbQuery(`SELECT id, title, embedding FROM products WHERE LOWER(title) = 'sac'`);
const sacProduct = result.rows[0];

if (!sacProduct) {
  console.log('❌ Produit "Sac" not found');
  process.exit(1);
}

let productEmb = sacProduct.embedding;
if (typeof productEmb === 'string') {
  productEmb = JSON.parse(productEmb);
}

console.log(`Product "Sac" embedding: ${productEmb.length} dims\n`);

// Calculer score
const score = cosineSimilarity(queryEmb, productEmb);
console.log(`Cosine similarity "sac" vs "Sac": ${score.toFixed(4)}`);
console.log(`Seuil minimum (avec Accessoires): 0.35`);
console.log(`Résultat: ${score > 0.35 ? '✅ PASSE' : '❌ REJETTE'}`);

process.exit(0);
