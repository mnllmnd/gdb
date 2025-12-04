#!/usr/bin/env node
/**
 * Test script for vector search endpoints
 * Usage: node test-vector-search.js [command]
 * 
 * Commands:
 *   test-search    - Test POST /api/vector-search
 *   test-categories - Test GET /api/search-categories
 *   test-debug    - Test GET /api/search-test (debug endpoint)
 *   all           - Run all tests
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const args = process.argv.slice(2);
const command = args[0] || 'all';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function testSearch() {
  log(colors.cyan, '\n📋 Testing POST /api/vector-search');
  log(colors.blue, '━'.repeat(50));

  const queries = [
    { query: 'je veux un sac bleu', category: 'sac' },
    { query: 'lampe de bureau', category: 'lampe' },
    { query: 'mobilier de salon' },  // auto-detect
  ];

  for (const { query, category } of queries) {
    try {
      log(colors.cyan, `\n🔍 Query: "${query}"`);
      if (category) log(colors.yellow, `   Category: ${category}`);

      const response = await axios.post(`${BASE_URL}/api/vector-search`, {
        query,
        category,
        limit: 3,
      });

      const { results, source, hasLowRelevance, message } = response.data;

      log(colors.green, `✅ Source: ${source}`);
      log(colors.yellow, `   Results: ${results.length}`);
      log(colors.yellow, `   Confidence: ${hasLowRelevance ? 'Low' : 'High'}`);
      log(colors.blue, `   Message: ${message}`);

      if (results.length > 0) {
        log(colors.cyan, '   Top results:');
        results.slice(0, 2).forEach((r, i) => {
          log(colors.yellow, `   ${i + 1}. ${r.name} (score: ${r.score?.toFixed(2)})`);
        });
      }
    } catch (error) {
      log(colors.red, `❌ Error: ${error.message}`);
      if (error.response?.data) {
        log(colors.red, `   ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

async function testCategories() {
  log(colors.cyan, '\n📚 Testing GET /api/search-categories');
  log(colors.blue, '━'.repeat(50));

  try {
    const response = await axios.get(`${BASE_URL}/api/search-categories`);
    const { categories } = response.data;

    log(colors.green, `✅ Categories available:`);
    categories.forEach((cat) => {
      log(colors.yellow, `   • ${cat}`);
    });
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
  }
}

async function testDebug() {
  log(colors.cyan, '\n🐛 Testing GET /api/search-test (debug)');
  log(colors.blue, '━'.repeat(50));

  try {
    const response = await axios.get(`${BASE_URL}/api/search-test`);
    const { test, category, results, source, hasLowRelevance } = response.data;

    log(colors.green, `✅ Debug test passed`);
    log(colors.yellow, `   Query: ${test}`);
    log(colors.yellow, `   Category: ${category}`);
    log(colors.yellow, `   Source: ${source}`);
    log(colors.yellow, `   Results: ${results.length}`);
    log(colors.yellow, `   Confidence: ${hasLowRelevance ? 'Low' : 'High'}`);

    if (results.length > 0) {
      log(colors.cyan, '   Top result:');
      const r = results[0];
      log(colors.yellow, `   • ${r.name} (category: ${r.category}, score: ${r.score?.toFixed(2)})`);
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
    if (error.response?.data) {
      log(colors.red, `   ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function runAllTests() {
  log(colors.cyan, '\n🚀 Vector Search Test Suite');
  log(colors.blue, `Target: ${BASE_URL}`);

  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/api/search-categories`);
    log(colors.green, '✅ Server is running\n');
  } catch (error) {
    log(colors.red, `❌ Server not reachable at ${BASE_URL}`);
    log(colors.yellow, 'Start server with: cd server && npm start');
    process.exit(1);
  }

  if (command === 'all' || command === 'test-search') {
    await testSearch();
  }

  if (command === 'all' || command === 'test-categories') {
    await testCategories();
  }

  if (command === 'all' || command === 'test-debug') {
    await testDebug();
  }

  log(colors.green, '\n✅ Test suite complete\n');
}

runAllTests().catch((error) => {
  log(colors.red, `\n❌ Fatal error: ${error.message}\n`);
  process.exit(1);
});
