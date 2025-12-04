#!/usr/bin/env node
import db from './src/db.js';
import { generateEmbedding, cosineSimilarity } from './src/services/embeddings.js';

async function testSearch() {
  console.log('🔍 Testing semantic search with fallback embeddings...\n');

  const testQueries = ['sac', 'banane', 'fleurs'];

  for (const query of testQueries) {
    console.log(`\nSearching for: "${query}"`);
    console.log('-'.repeat(50));

    try {
      // Get query embedding
      const queryEmbedding = await generateEmbedding(query);
      if (!queryEmbedding) {
        console.log('  ❌ Could not generate query embedding');
        continue;
      }

      // Get all products with embeddings
      const products = await db.query(
        'SELECT id, title, category_id, embedding FROM products WHERE embedding IS NOT NULL'
      );

      if (products.length === 0) {
        console.log('  ⚠️  No products with embeddings in DB');
        continue;
      }

      console.log(`  📦 Found ${products.length} products with embeddings`);

      // Score each product
      const scored = products.map(p => ({
        ...p,
        score: cosineSimilarity(
          queryEmbedding,
          p.embedding
        )
      })).sort((a, b) => b.score - a.score);

      console.log('\n  Top 3 results:');
      for (let i = 0; i < Math.min(3, scored.length); i++) {
        const p = scored[i];
        const threshold = 0.35;
        const status = p.score > threshold ? '✅' : '❌';
        console.log(`    ${i + 1}. [${status}] ${p.title.substring(0, 30)} - Score: ${p.score.toFixed(4)}`);
      }

      // Check which pass threshold
      const passed = scored.filter(p => p.score > 0.35);
      console.log(`\n  Results above threshold (0.35): ${passed.length}`);
      if (passed.length > 0) {
        console.log(`    ✅ Would return: ${passed.map(p => p.title).join(', ')}`);
      } else {
        console.log('    Returns: 0 results');
      }

    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  await db.end();
  console.log('\n✅ Search test complete!');
}

await testSearch();
