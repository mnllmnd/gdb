import axios from 'axios';
import { query as dbQuery } from './src/db.js';

console.log('🔍 DEBUG: Tester "banane" vs "Fleurs"\n');

// Fonction cosinus similarity (copie de embeddings.js)
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

// 1. Générer embedding pour "banane"
console.log('1️⃣ Générer embedding pour "banane"...');
let bananeEmbed = null;

if (process.env.HUGGINGFACE_API_KEY) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/all-MiniLM-L6-v2',
      { inputs: 'banane' },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        timeout: 5000,
      }
    );
    if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
      bananeEmbed = response.data[0];
      console.log(`   ✅ HuggingFace embedding: ${bananeEmbed.length} dimensions`);
      console.log(`   First 5 values: ${JSON.stringify(bananeEmbed.slice(0, 5))}`);
    }
  } catch (e) {
    console.log(`   ❌ HF failed: ${e.message}`);
  }
}

if (!bananeEmbed) {
  console.log('   ⚠️ HuggingFace not available, using fallback');
  // Simple fallback
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const hash32 = str.charCodeAt(i);
      hash = (hash << 5) - hash + hash32;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  const EMBEDDING_DIMENSION = 384;
  const embedding = new Array(EMBEDDING_DIMENSION).fill(0);
  const words = 'banane'.toLowerCase().split(/\s+/);
  for (const word of words) {
    const hash = hashCode(word);
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      embedding[i] += Math.sin((hash + i) * 0.5) * 0.1;
    }
  }
  const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
  bananeEmbed = norm > 0 ? embedding.map(x => x / norm) : embedding;
  console.log(`   Fallback embedding: ${bananeEmbed.length} dimensions`);
}

// 2. Récupérer embedding "Fleurs" de la DB
console.log('\n2️⃣ Récupérer embedding "Fleurs" de la DB...');
const result = await dbQuery(`SELECT embedding FROM products WHERE LOWER(title) = 'fleurs'`);
if (result.rows.length === 0) {
  console.log('   ❌ Produit Fleurs not found!');
  process.exit(1);
}
const fleursRow = result.rows[0];
let fleursEmbed = fleursRow.embedding;
if (typeof fleursEmbed === 'string') {
  fleursEmbed = JSON.parse(fleursEmbed);
}
console.log(`   ✅ Fleurs embedding: ${fleursEmbed.length} dimensions`);
console.log(`   First 5 values: ${JSON.stringify(fleursEmbed.slice(0, 5))}`);

// 3. Calculer la similarité
console.log('\n3️⃣ Calculer cosine similarity...');
const score = cosineSimilarity(bananeEmbed, fleursEmbed);
console.log(`   Score: ${score.toFixed(4)}`);
console.log(`   Seuil minimum (sans catégorie): 0.65 (STRICT)`);
console.log(`   ✅ Devrait rejeter? ${score > 0.65 ? '❌ NON (BUG!)' : '✅ OUI - Correct!'}`);

console.log('\n✅ Done.');
process.exit(0);
