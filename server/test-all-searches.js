import axios from 'axios';

const API_ROOT = 'http://localhost:4000';

console.log('🧪 Test 1: "je veux une banane" (produit inexistant)');
try {
  let res = await axios.post(`${API_ROOT}/api/vector-search`, {
    query: 'je veux une banane',
    category: null,
    limit: 8,
  });
  console.log(`  Results: ${res.data.results.length} ❌ (Correct: 0 résultats)\n`);
} catch (err) {
  console.error('  Error:', err.message);
}

console.log('🧪 Test 2: "sac bleu" (produit qui devrait exister)');
try {
  let res = await axios.post(`${API_ROOT}/api/vector-search`, {
    query: 'sac bleu',
    category: null,
    limit: 8,
  });
  console.log(`  Results: ${res.data.results.length} ${res.data.results.length > 0 ? '✅' : '❌'}`);
  if (res.data.results.length > 0) {
    res.data.results.forEach((r, i) => {
      console.log(`    ${i+1}. "${r.name}" (score: ${r.score.toFixed(4)})`);
    });
  }
} catch (err) {
  console.error('  Error:', err.message);
}

console.log('\n🧪 Test 3: "shoe" / "Shoe" (produit qui existe)');
try {
  let res = await axios.post(`${API_ROOT}/api/vector-search`, {
    query: 'shoe',
    category: null,
    limit: 8,
  });
  console.log(`  Results: ${res.data.results.length} ${res.data.results.length > 0 ? '✅' : '❌'}`);
  if (res.data.results.length > 0) {
    res.data.results.forEach((r, i) => {
      console.log(`    ${i+1}. "${r.name}" (score: ${r.score.toFixed(4)})`);
    });
  }
} catch (err) {
  console.error('  Error:', err.message);
}

process.exit(0);
