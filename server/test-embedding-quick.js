#!/usr/bin/env node
import { generateEmbedding } from './src/services/embeddings.js';

async function testEmbedding() {
  console.log('🧪 Testing embedding generation with fallback...\n');

  const testCases = [
    'sac',
    'banane',
    'fleurs',
    'chemise nike'
  ];

  for (const text of testCases) {
    try {
      console.log(`Testing: "${text}"`);
      const embedding = await generateEmbedding(text);
      
      if (!embedding) {
        console.log('  ❌ No embedding returned\n');
        continue;
      }

      if (!Array.isArray(embedding)) {
        console.log(`  ❌ Not an array: ${typeof embedding}\n`);
        continue;
      }

      console.log(`  ✅ Generated embedding (dimension: ${embedding.length})`);
      console.log(`  Sample values: [${embedding.slice(0, 5).map(x => x.toFixed(4)).join(', ')}...]`);
      console.log();
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
  }

  console.log('✅ Embedding test complete!');
}

await testEmbedding();
