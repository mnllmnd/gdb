import express from 'express';
import fs from 'fs';
import path from 'path';
import { init as initNlp } from '../../nlp/index.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// POST /api/nlp/retrain
// Requires x-admin-token header matching ADMIN_TOKEN env or NODE_ENV=development
router.post('/retrain', async (req, res) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    const provided = req.headers['x-admin-token'] || req.body?.admin_token;
    const allowed = process.env.NODE_ENV === 'development' || (adminToken && provided && String(provided) === String(adminToken));
    if (!allowed) return res.status(403).json({ error: 'Forbidden. Provide ADMIN_TOKEN or run in development mode.' });

    const modelPath = path.resolve(process.cwd(), 'server', 'model.nlp');
    if (fs.existsSync(modelPath)) {
      try {
        fs.unlinkSync(modelPath);
        console.log('Deleted existing NLP model at', modelPath);
      } catch (e) {
        console.warn('Failed to delete model file:', e.message);
      }
    }

    // Force retrain by calling init (it will create/train/save the model)
    try {
      await initNlp();
      return res.json({ success: true, message: 'NLP model retrained and saved.' });
    } catch (trainErr) {
      console.error('NLP retrain failed:', trainErr);
      return res.status(500).json({ success: false, error: trainErr?.message || String(trainErr) });
    }
  } catch (err) {
    console.error('NLP retrain route error:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// GET /api/nlp/status
router.get('/status', async (req, res) => {
  try {
    const modelPath = path.resolve(process.cwd(), 'server', 'model.nlp');
    if (!fs.existsSync(modelPath)) {
      return res.json({ exists: false, message: 'No model file found' });
    }
    const st = fs.statSync(modelPath);
    return res.json({ exists: true, path: modelPath, size: st.size, modifiedAt: st.mtime });
  } catch (err) {
    console.error('NLP status error:', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

export default router;
