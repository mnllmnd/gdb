import axios from 'axios';

const API_ROOT = process.env.API_ROOT || 'http://localhost:4000';

console.log('🧪 Test: /api/vector-search avec "je veux une banane"\n');

try {
  const response = await axios.post(`${API_ROOT}/api/vector-search`, {
    query: 'je veux une banane',
    category: null,
    limit: 8,
  });

  console.log('✅ Response received:');
  console.log(JSON.stringify(response.data, null, 2));
  
  if (response.data.results && response.data.results.length === 0) {
    console.log('\n🎉 SUCCESS! Zero results returned for "banane" search');
  } else {
    console.log(`\n⚠️ WARNING: ${response.data.results.length} results returned:`);
    response.data.results.forEach((r, i) => {
      console.log(`  ${i+1}. "${r.name}" (score: ${r.score.toFixed(4)})`);
    });
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.response) {
    console.error('Response:', error.response.data);
  }
}

process.exit(0);
