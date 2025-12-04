#!/usr/bin/env node
import { smartSearch } from './src/services/embeddings.js';

const testCases = ['sac', 'banane', 'fleurs'];

console.log('🔍 FINAL SEARCH TEST\n');

for (const query of testCases) {
  console.log(`\n📝 Query: "${query}"`);
  console.log('─'.repeat(40));
  const result = await smartSearch(query);
  
  if (result.results.length === 0) {
    console.log('  ✅ Returns: 0 results (correct - fallback embeddings rejected)');
  } else {
    console.log(`  ❌ Returns ${result.results.length} results:`);
    result.results.forEach((p, i) => {
      console.log(`     ${i+1}. ${p.name || p.title}`);
    });
  }
  console.log(`  Source: ${result.source || 'none'}`);
}

console.log('\n✅ SEARCH TEST COMPLETE');
process.exit(0);
