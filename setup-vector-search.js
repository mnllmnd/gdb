#!/usr/bin/env node
/**
 * Quick setup script for vector search
 * 
 * Usage:
 *   node setup-vector-search.js          - Interactive setup
 *   node setup-vector-search.js --skip   - Skip Meilisearch check
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, text) {
  console.log(color + text + colors.reset);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(colors.cyan + question + colors.reset, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setup() {
  log(colors.blue, '\n╔═══════════════════════════════════════╗');
  log(colors.blue, '║   Vector Search Setup Wizard          ║');
  log(colors.blue, '╚═══════════════════════════════════════╝\n');

  const envPath = path.join(process.cwd(), 'server', '.env.local');
  let envContent = '';

  // Check if .env.local exists
  if (fs.existsSync(envPath)) {
    log(colors.yellow, '⚠️  .env.local already exists');
    const overwrite = await prompt('Overwrite? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes') {
      log(colors.yellow, '📝 Using existing .env.local');
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
  }

  log(colors.cyan, '\n📋 Enter your configuration:\n');

  // Meilisearch
  log(colors.blue, '🔍 Meilisearch Configuration:');
  const meilisearchHost = await prompt(
    '   Meilisearch Host (default: http://localhost:7700): '
  ) || 'http://localhost:7700';

  const meilisearchKey = await prompt(
    '   Meilisearch API Key: '
  );

  // Sanity
  log(colors.blue, '\n💾 Sanity Configuration:');
  const sanityProjectId = await prompt(
    '   Sanity Project ID (default: ynv4chv6): '
  ) || 'ynv4chv6';

  const sanityDataset = await prompt(
    '   Sanity Dataset (default: production): '
  ) || 'production';

  const sanityToken = await prompt(
    '   Sanity API Token: '
  );

  if (!sanityToken) {
    log(colors.red, '\n❌ Sanity API Token is required!');
    process.exit(1);
  }

  // Optional: Ollama
  log(colors.blue, '\n🤖 Optional - Embedding Service:');
  const useOllama = await prompt(
    '   Use Ollama for local embeddings? (yes/no): '
  );

  let ollamaHost = '';
  if (useOllama.toLowerCase() === 'yes') {
    ollamaHost = await prompt(
      '   Ollama Host (default: http://localhost:11434): '
    ) || 'http://localhost:11434';
  }

  // Build .env.local
  const newEnv = `# ===========================
# MEILISEARCH CONFIGURATION
# ===========================
MEILISEARCH_HOST=${meilisearchHost}
MEILISEARCH_KEY=${meilisearchKey}

# ===========================
# SANITY CONFIGURATION
# ===========================
SANITY_PROJECT_ID=${sanityProjectId}
SANITY_DATASET=${sanityDataset}
SANITY_TOKEN=${sanityToken}

# ===========================
# OPTIONAL: EMBEDDINGS
# ===========================
${ollamaHost ? `OLLAMA_HOST=${ollamaHost}` : '# OLLAMA_HOST=http://localhost:11434'}

# HUGGINGFACE_API_KEY=<your_key>  # Not recommended (rate limited)

# ===========================
# FRONTEND CONFIG
# ===========================
VITE_API_URL=http://localhost:3000

# ===========================
# ENVIRONMENT
# ===========================
NODE_ENV=development
`;

  // Write .env.local
  try {
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    fs.writeFileSync(envPath, newEnv);
    log(colors.green, `\n✅ Configuration saved to: server/.env.local`);
  } catch (error) {
    log(colors.red, `\n❌ Failed to write .env.local: ${error.message}`);
    process.exit(1);
  }

  // Validation
  log(colors.cyan, '\n🔍 Configuration Summary:');
  log(colors.yellow, `   Meilisearch: ${meilisearchHost}`);
  log(colors.yellow, `   Sanity Project: ${sanityProjectId}`);
  log(colors.yellow, `   Sanity Dataset: ${sanityDataset}`);
  log(colors.yellow, `   Sanity Token: ${sanityToken.substring(0, 10)}...`);
  if (ollamaHost) {
    log(colors.yellow, `   Ollama: ${ollamaHost}`);
  } else {
    log(colors.yellow, '   Embeddings: Local pseudo-embedding (no external API)');
  }

  // Next steps
  log(colors.green, '\n✅ Setup complete!\n');
  log(colors.blue, '📚 Next steps:');
  log(colors.cyan, '   1. Start the server:');
  log(colors.yellow, '      cd server && npm start\n');
  log(colors.cyan, '   2. In another terminal, run tests:');
  log(colors.yellow, '      node test-vector-search.js all\n');
  log(colors.cyan, '   3. Index products (first time):');
  log(colors.yellow, '      curl -X POST http://localhost:3000/api/index-products \\');
  log(colors.yellow, '           -H "Content-Type: application/json" \\');
  log(colors.yellow, '           -d \'{"products":[...]}\'\n');
  log(colors.cyan, '   4. Open the chat and test search:');
  log(colors.yellow, '      npm run dev  # Frontend\n');

  log(colors.blue, '📖 Documentation:');
  log(colors.cyan, '   Read VECTOR_SEARCH_SETUP.md for detailed guide');

  rl.close();
}

setup().catch((error) => {
  log(colors.red, `\n❌ Setup failed: ${error.message}`);
  rl.close();
  process.exit(1);
});
