// src/index.js
import express from 'express';
import nlpManager from '../nlp/index.js';
import detectEmotion from '../nlp/emotions.js';
import recommend from '../nlp/recommend.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/uploads.js';
import shopRoutes from './routes/shops.js';
import categoryRoutes from './routes/categories.js';
import recommendRoutes from './routes/recommend.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(helmet());
// Configure CORS to accept the frontend origin provided via env (CLIENT_URL or FRONTEND_URL)
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || null
if (CLIENT_URL) {
  app.use(cors({ origin: CLIENT_URL }))
  console.log(`🔒 CORS configured for: ${CLIENT_URL}`)
} else {
  // In development, allow all (or restrict as needed)
  app.use(cors())
  console.log('⚠️  CORS not restricted (no CLIENT_URL set).')
}
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/recommend', recommendRoutes);

// Route NLP améliorée
app.post('/api/message', async (req, res) => {
  try {
    const { message, userProfile = {} } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: 'Message is required',
        understood: false
      });
    }

    const response = await nlpManager.process('fr', message);
    const emotion = detectEmotion(message);
    const recommendations = recommend(userProfile, message);

    // Réponse contextuelle basée sur l'intent détecté
    let contextualAnswer = response.answer;
    let additionalData = {};

    if (response.intent === 'recherche_produit' && recommendations.length > 0) {
      contextualAnswer = `J'ai trouvé ${recommendations.length} produit(s) qui correspondent à votre recherche !`;
      additionalData.productCount = recommendations.length;
    } else if (response.intent === 'recherche_produit' && recommendations.length === 0) {
      contextualAnswer = "Je n'ai pas trouvé de produits correspondant à votre recherche. Pouvez-vous préciser ?";
    } else if (response.intent === 'prix_promotion') {
      contextualAnswer = "Voici nos meilleures offres et promotions actuelles !";
      additionalData.hasPromotions = true;
    } else if (response.intent === 'livraison_info') {
      contextualAnswer = "Livraison offerte à partir de 50€ d'achat ! Délai moyen : 2-3 jours.";
      additionalData.deliveryInfo = {
        freeThreshold: 50,
        averageDelay: '2-3 jours',
        methods: ['Point relais', 'Domicile', 'Retrait magasin']
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

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ 
      error: 'Désolé, je rencontre un problème technique. Pouvez-vous reformuler votre message ?',
      understood: false,
      fallback: true
    });
  }
});

// Route santé de l'API NLP
app.get('/api/nlp/health', async (req, res) => {
  try {
    const testResponse = await nlpManager.process('fr', 'bonjour');
    res.json({
      status: 'healthy',
      nlpWorking: true,
      intentsCount: nlpManager.intents.length,
      testIntent: testResponse.intent
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      nlpWorking: false,
      error: error.message
    });
  }
});

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route de base
app.get('/', (req, res) => res.json({ 
  ok: true, 
  message: 'Marketplace backend with NLP capabilities',
  version: '1.0.0',
  endpoints: {
    chat: '/api/message',
    auth: '/api/auth',
    products: '/api/products',
    nlpHealth: '/api/nlp/health'
  }
}));

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'POST /api/message',
      'GET /api/nlp/health',
      'POST /api/auth/login',
      'GET /api/products',
      'POST /api/orders'
    ]
  });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  const host = process.env.HOSTNAME || 'localhost'
  const proto = process.env.PROTOCOL || 'http'
  const base = process.env.API_ROOT || `${proto}://${host}:${port}`
  console.log(`📝 NLP Chat endpoint: ${base}/api/message`);
  console.log(`🏥 Health check: ${base}/api/nlp/health`);
});