// ==========================
// IMPORTS
// ==========================
import express from 'express';
import nlpManager, { init as initNlp } from '../nlp/index.js';
import tfidfCache from './tfidf_cache.js';
import cache from './cache.js';
import detectEmotion from '../nlp/emotions.js';
import recommend from '../nlp/recommend.js';
import dotenv from 'dotenv';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import passwordResetRoutes from './routes/passwordReset.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import testEmailRoutes from './routes/testEmail.js';
import uploadRoutes from './routes/uploads.js';
// import shopRoutes from './routes/shops.js'; // REMOVED
import categoryRoutes from './routes/categories.js';
import recommendRoutes from './routes/recommend.js';
import feedRoutes from './routes/feed.js';
import reelsRoutes from './routes/reels.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import cacheRoutes from './routes/cache.js';
import vectorSearchRoutes from './routes/vectorSearch.js';
import { setupMeilisearchIndex, indexProductsBatch } from './services/embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================
// SECURITY & HEADERS
// ==========================
app.use(helmet());
app.set("trust proxy", 1); // Fix Render proxy warnings

// ==========================
// CORS CONFIG
// ==========================
const allowedOrigins = [
  process.env.FRONTEND_URL,   // ex: https://llmnd.vercel.app
  process.env.CLIENT_URL,     // ex: http://localhost:3000 (local)
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
].filter(Boolean);

console.log("🔒 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / direct calls OK

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ==========================
// CACHE-CONTROL middleware
// ==========================
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ==========================
// ROUTES
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', testEmailRoutes);
app.use('/api/uploads', uploadRoutes);
// app.use('/api/shops', shopRoutes); // REMOVED: Shop functionality disabled
app.use('/api/categories', categoryRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api', vectorSearchRoutes);

// ==========================
// NLP CHAT ENDPOINT
// ==========================
app.post('/api/message', async (req, res) => {
  try {
    const { message, userProfile = {} } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required', understood: false });
    }

    const response = await nlpManager.process('fr', message);
    const emotion = detectEmotion(message);
    const recommendations = await recommend(userProfile, message);

    let contextualAnswer = response.answer;
    let additionalData = {};

    if (response.intent === 'recherche_produit') {
      contextualAnswer =
        recommendations.length > 0
          ? `J'ai trouvé ${recommendations.length} produit(s) pour vous !`
          : "Aucun produit trouvé. Pouvez-vous préciser ?";
    }

    if (response.intent === 'prix_promotion') {
      contextualAnswer = "Voici nos promotions actuelles !";
      additionalData.hasPromotions = true;
    }

    if (response.intent === 'livraison_info') {
      contextualAnswer = "Livraison 2-3 jours, offerte à partir de 50€.";
      additionalData.deliveryInfo = {
        freeThreshold: 50,
        averageDelay: '2-3 jours'
      };
    }

    res.json({
      intent: response.intent,
      answer: contextualAnswer,
      emotion,
      recommendations,
      confidence: response.score,
      understood: response.score > 0.6,
      ...additionalData,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'Technical error', fallback: true });
  }
});

// ==========================
// NLP HEALTH CHECK
// ==========================
app.get('/api/nlp/health', async (req, res) => {
  try {
    const test = await nlpManager.process('fr', 'bonjour');
    res.json({ status: 'healthy', intent: test.intent });
  } catch (err) {
    res.status(500).json({ status: 'down', error: err.message });
  }
});

// ==========================
// STATIC UPLOADS
// ==========================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================
// SERVE FRONTEND (if exists)
// ==========================
const clientDist = path.join(__dirname, '../../dist');

if (fs.existsSync(clientDist)) {
  console.log("📦 Serving frontend from", clientDist);

  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) return;
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ==========================
// BASIC ROOT
// ==========================
app.get('/', (req, res) =>
  res.json({
    ok: true,
    message: 'Marketplace backend running',
    version: '1.0.0',
  })
);

// ==========================
// 404 HANDLER
// ==========================
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((error, req, res, next) => {
  console.error("GLOBAL ERROR:", error);
  res.status(500).json({ error: 'Internal server error' });
});

// ==========================
// START SERVER
// ==========================
const port = process.env.PORT || 4000;

const start = async () => {
  try {
    await initNlp();
  } catch (err) {
    console.log("NLP init failed:", err.message);
  }

  try {
    const { query: dbQuery } = await import('./db.js');
    await tfidfCache.init(dbQuery);
    await cache.init(dbQuery);
  } catch (err) {
    console.log("Cache init error:", err.message);
  }

  // Setup Meilisearch pour recherche vectorielle
  try {
    await setupMeilisearchIndex();
    console.log('✅ Index Meilisearch prêt');

    // Auto-index products from database
    try {
      const { query: dbQuery } = await import('./db.js');
      const result = await dbQuery(
        `SELECT 
          p.id, 
          p.title as name,
          c.name as category,
          p.price, 
          p.description, 
          p.image_url
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LIMIT 1000`
      );
      const products = result.rows || [];
      
      if (products.length > 0) {
        await indexProductsBatch(products);
        console.log(`✅ ${products.length} produits indexés dans Meilisearch`);
      } else {
        console.warn('⚠️ Aucun produit trouvé dans la base de données');
      }
    } catch (indexErr) {
      console.warn('⚠️ Impossible d\'indexer les produits:', indexErr.message);
    }
  } catch (err) {
    console.warn('⚠️ Meilisearch non disponible:', err.message);
  }

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
};

start();

