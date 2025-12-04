import axios from 'axios';

const API_ROOT = 'http://localhost:4000';

console.log('Test final: "sac" (Accessoires category)');
try {
  const res = await axios.post(`${API_ROOT}/api/vector-search`, {
    query: 'sac',
    category: null,
    limit: 8,
  });
  
  console.log('Response:', JSON.stringify(res.data, null, 2));
  
  if (res.data.results && res.data.results.length > 0) {
    console.log('\n✅ Found results:');
    res.data.results.forEach((r, i) => {
      console.log(`  ${i+1}. "${r.name}" (score: ${r.score.toFixed(4)})`);
    });
  } else {
    console.log('\n❌ No results found');
  }
} catch (err) {
  console.error('Error:', err.message);
  if (err.response?.data) {
    console.error('Response:', err.response.data);
  }
}

process.exit(0);
