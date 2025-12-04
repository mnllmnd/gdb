#!/usr/bin/env node
import { vectorSearch } from './src/services/embeddings.js';

async function testSearch() {
  console.log('🔍 Testing semantic search with fallback embeddings...\n');

  const testQueries = ['sac', 'banane', 'fleurs'];

  for (const query of testQueries) {
    console.log(`\nSearching for: "${query}"`);
    console.log('-'.repeat(50));

    try {
      const results = await vectorSearch(query);
      
      console.log(`  📊 Top 3 results:`);
      if (results.length === 0) {
        console.log('    Returns: 0 results');
      } else {
        for (let i = 0; i < Math.min(3, results.length); i++) {
          const r = results[i];
          console.log(`    ${i + 1}. ${r.title.substring(0, 35)} - Score: ${r.score?.toFixed(4) || 'N/A'}`);
        }
      }

      console.log(`  ✅ Total results: ${results.length}`);

    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n✅ Search test complete!');
}

await testSearch();
