#!/usr/bin/env node
import db from './src/db.js';
import { generateEmbedding, cosineSimilarity } from './src/services/embeddings.js';

async function testDirectSearch() {
  console.log('🔍 Direct semantic search test\n');

  const testQueries = ['sac', 'banane', 'fleurs'];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('=' .repeat(50));

    try {
      // Generate query embedding
      const queryEmb = await generateEmbedding(query);
      if (!queryEmb) {
        console.log('❌ No embedding generated');
        continue;
      }

      // Get all products with embeddings
      const result = await db.query('SELECT id, title, embedding FROM products WHERE embedding IS NOT NULL ORDER BY title');
      const products = result.rows || [];

      console.log(`📦 Scored against ${products.length} products:`);

      // Score each
      const scored = products.map(p => {
        let emb = p.embedding;
        if (typeof emb === 'string') {
          try {
            emb = JSON.parse(emb);
          } catch (e) {
            return { ...p, score: 0 };
          }
        }

        const score = Array.isArray(emb) ? cosineSimilarity(queryEmb, emb) : 0;
        return { ...p, score };
      }).sort((a, b) => b.score - a.score);

      // Show all with scores
      for (const p of scored) {
        const pass = p.score > 0.35 ? '✅' : '  ';
        console.log(`  ${pass} ${p.title.padEnd(20)} Score: ${p.score.toFixed(4)}`);
      }

      // Summary
      const passing = scored.filter(p => p.score > 0.35);
      console.log(`\n  → Results above 0.35 threshold: ${passing.length}`);
      if (passing.length > 0) {
        console.log(`    ${passing.map(p => p.title).join(', ')}`);
      } else {
        console.log(`    (returns 0 results)`);
      }

    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  await db.end();
  console.log('\n✅ Test complete!');
}

await testDirectSearch();
