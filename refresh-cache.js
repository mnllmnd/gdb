#!/usr/bin/env node
/**
 * Quick script to force refresh the server cache
 * Usage: node refresh-cache.js [token]
 * Example: node refresh-cache.js "eyJhbGc..."
 */

const token = process.argv[2];
const apiUrl = process.argv[3] || 'http://localhost:4000/api/cache/refresh-user';

if (!token) {
  console.error('❌ Token required. Usage: node refresh-cache.js "YOUR_TOKEN"');
  console.error('');
  console.error('Get your token from browser localStorage:');
  console.error('  Open DevTools (F12) → Console → localStorage.getItem("token")');
  process.exit(1);
}

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Cache refreshed successfully!');
      console.log('  The deleted product should now disappear from all listings.');
    } else {
      console.error('❌ Cache refresh failed:', data.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
