import express from 'express';
import natural from 'natural';
import nlpManager from '../../nlp/index.js';
import { query as dbQuery } from '../db.js';

const router = express.Router();

// Nous lisons désormais les produits depuis la base de données (via server/src/db.js)
// pour garantir que seules les offres réellement présentes sur la plateforme sont recommandées.

// Utilitaires NLP/Extraction
const extractBudget = (text = '') => {
  if (!text) return null;
  // Normaliser les espaces et les formats comme "20 000" -> "20000"
  const clean = text.replace(/\s+/g, ' ').toLowerCase();

  // Chercher explicitement "sous/moins de/moins que/inférieur à" suivi d'un nombre
  const match = clean.match(/(?:sous|moins de|moins que|inférieur(?:e)? à|budget(?: max|:)?|max)\s*:?\s*([\d\s]+(?:[.,]\d+)?)/i);
  if (match && match[1]) {
    return Number(match[1].replace(/[\s,.]/g, ''));
  }

  // Chercher un nombre suivi de devise (FCFA, XAF, etc.)
  const match2 = clean.match(/([\d\s]+(?:[.,]\d+)?)\s*(fcfa|xaf|cfa)/i);
  if (match2 && match2[1]) return Number(match2[1].replace(/[\s,.]/g, ''));

  // Si on trouve un nombre et qu'il y a un mot-besoin comme "budget" ou "max" -> on prend
  const anyNum = clean.match(/(\d[\d\s]{0,6})/);
  if (anyNum && /(budget|max|au plus|au moins|moins)/i.test(clean)) {
    return Number(anyNum[1].replace(/[\s,.]/g, ''));
  }

  return null;
};

// Extraction de mots-clés simples (tokenize + suppression stopwords)
const simpleKeywords = (text = '') => {
  const tokenizer = new natural.WordTokenizer();
  const stopwords = new Set(['le','la','les','un','une','et','à','de','du','pour','avec','dans','mon','ma','mes','je','tu','il','elle','nous','vous','des','au','aux','sur','chez','ce','cette','ces']);
  return tokenizer.tokenize(text.toLowerCase()).filter(t => t.length > 1 && !stopwords.has(t));
};

// Calcul de similarité cosinus entre 2 vecteurs représentés comme { term: score }
const cosineSimilarity = (a = {}, b = {}) => {
  const intersection = Object.keys(a).filter(k => b[k] !== undefined);
  let dot = 0;
  intersection.forEach(k => { dot += a[k] * b[k]; });
  const magA = Math.sqrt(Object.values(a).reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(Object.values(b).reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

// Construire les vecteurs TF-IDF pour les produits + requête
const buildTfidfVectors = (products, query) => {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Ajouter un document par produit
  products.forEach(p => tfidf.addDocument(`${p.name} ${p.description} ${p.category}`));

  // Ajouter la requête comme dernier document
  tfidf.addDocument(query || '');
  const queryIndex = products.length;

  // Pour chaque doc, construire un map term->tfidf
  const docs = [];
  for (let i = 0; i <= queryIndex; i++) {
    const map = {};
    // listTerms renvoie des { term, tfidf } triés
    tfidf.listTerms(i).forEach(t => {
      map[t.term] = t.tfidf;
    });
    docs.push(map);
  }

  return { docs, queryIndex };
};

// POST / (endpoint principal pour recommandations)
router.post('/', async (req, res) => {
  try {
    const text = (req.body.text || '').toString();
    let budget = req.body.budget ? Number(req.body.budget) : null;

    // Extraire budget si l'utilisateur l'a inclus dans la phrase
    const extracted = extractBudget(text);
    if (!budget && extracted) budget = extracted;

    // Traitement NLP pour détecter l'intent et les entités (node-nlp)
    const nlpResp = await nlpManager.process('fr', text || '');
  const baseIntent = nlpResp.intent || null;

    // Extraire mots-clés simples
    const keywords = simpleKeywords(text);

    // Détecter des intents spécifiques (cadeau femme, etc.) - règles simples FR
    let detectedIntent = baseIntent;
    if (/cadeau|offrir|surprise|fête|anniversaire/i.test(text) && /femme|épouse|ma femme|pour elle|pour ma femme/i.test(text)) {
      detectedIntent = 'gift.woman';
    } else if (/cadeau|offrir|anniversaire|fête/i.test(text) && /homme|monsieur|pour lui|mon mari/i.test(text)) {
      detectedIntent = 'gift.man';
    }

        // Lire les produits et catégories depuis la base de données
      // Use p.title (column exists) as product name; COALESCE with p.name caused errors when p.name did not exist
      const prodRes = await dbQuery('SELECT p.id, p.title AS name, p.description, p.price, c.name AS category, p.image_url FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.price IS NOT NULL');
        const productsFromDb = (prodRes?.rows || []).map(r => ({
          id: r.id,
          name: r.name || 'Produit',
          price: Number(r.price) || 0,
          description: r.description || '',
          category: (r.category || '').toLowerCase(),
          image: r.image_url || null
        }));

        // Si aucun produit disponible, retourner vide
        if (!productsFromDb.length) {
          return res.json({ query: text, detectedIntent, baseIntent, keywords, budget: budget || null, results: [] });
        }

        // Récupérer la liste des catégories réelles pour adapter le mapping
        const catRes = await dbQuery('SELECT id, name FROM categories');
        const categoriesList = (catRes?.rows || []).map(c => (c.name || '').toLowerCase());

        // Dictionnaire de mots-clés -> termes de catégorie (on cherche la catégorie réelle correspondante)
        const SYNONYM_GROUPS = {
          beauty: ['parfum', 'parfume', 'parfumé', 'parfumée', 'cosmetique', 'cosmétique', 'maquillage', 'beaute', 'beauty'],
          accessories: ['bijou', 'bijoux', 'sac', 'handbag', 'montre', 'bracelet', 'collier', 'jewelry', 'accessoire', 'accessories'],
          decoration: ['bougie', 'candle', 'décoration', 'deco', 'lampe', 'vase', 'décor'],
          clothing: ['robe', 'pantalon', 'chemise', 'tshirt', 'vêtement', 'vetement', 'vetements', 'outfit'],
          food: ['chocolat', 'gourmand', 'aliment', 'nourriture', 'food']
        };

        // Trouver la catégorie réelle correspondant à un groupe de synonymes
        const findRealCategory = (synonyms) => {
          for (const catName of categoriesList) {
            for (const kw of synonyms) {
              if (catName.includes(kw)) return catName
            }
          }
          return null
        }

        // Construire liste de catégories préférées en fonction de l'intent et des mots-clés
        const preferredCategories = new Set();
        if (detectedIntent === 'gift.woman') {
          const c1 = findRealCategory(SYNONYM_GROUPS.beauty)
          const c2 = findRealCategory(SYNONYM_GROUPS.accessories)
          if (c1) preferredCategories.add(c1)
          if (c2) preferredCategories.add(c2)
        }
        if (detectedIntent === 'gift.man') {
          const c1 = findRealCategory(SYNONYM_GROUPS.accessories)
          const c2 = findRealCategory(SYNONYM_GROUPS.clothing)
          if (c1) preferredCategories.add(c1)
          if (c2) preferredCategories.add(c2)
        }

        const lowered = text.toLowerCase();
        for (const kws of Object.values(SYNONYM_GROUPS)) {
          for (const kw of kws) {
            if (lowered.includes(kw)) {
              const real = findRealCategory(kws)
              if (real) preferredCategories.add(real)
              break
            }
          }
        }

        const isPreferredCategory = (p) => preferredCategories.size === 0 ? false : preferredCategories.has((p.category || '').toLowerCase());

  // Construire TF-IDF et vecteurs à partir des produits récupérés
  const { docs, queryIndex } = buildTfidfVectors(productsFromDb, text);
  const queryVec = docs[queryIndex];

    // Paramètres de pondération : ajuster selon besoin
    const WEIGHT_SEMANTIC = 0.8; // importance de la similarité sémantique
    const WEIGHT_INTENT = 0.2;   // importance d'un boost basé sur l'intent / mots-clés

    // Évaluer chaque produit
  let scored = productsFromDb.map((p, i) => {
      const docVec = docs[i] || {};
      const sim = cosineSimilarity(queryVec, docVec);

      // Boost simple si mots-clés correspondent au nom/catégorie
      let intentBoost = 0;
  const lowerName = (p.name || '').toLowerCase();
  const lowerCat = (p.category || '').toLowerCase();

      // Boost si le produit appartient à une catégorie préférée (ex: beauty/accessories pour gift.woman)
      if (isPreferredCategory(p)) intentBoost += 0.6;

      // Mots-clés détectés dans la requête -> si présents dans le produit, booster modestement
      for (const k of keywords) {
        if (lowerName.includes(k) || lowerCat.includes(k) || (p.description || '').toLowerCase().includes(k)) {
          intentBoost += 0.15;
        }
      }

      // Limiter le boost
      if (intentBoost > 1) intentBoost = 1;

      const finalScore = WEIGHT_SEMANTIC * sim + WEIGHT_INTENT * intentBoost;

      return { product: p, sim, intentBoost, finalScore };
    });

    // Filtrer selon budget s'il est fourni (en FCFA ou unité similaire)
    const applyBudgetFilter = (arr, maxBudget) => {
      if (!maxBudget) return arr
      return arr.filter(s => s.product.price <= maxBudget)
    }

    const sortAndTake = (arr, topN = 6) => {
      arr.sort((a, b) => {
        if (b.finalScore === a.finalScore) return a.product.price - b.product.price
        return b.finalScore - a.finalScore
      })
      return arr.slice(0, topN).map(s => ({
        id: s.product.id,
        name: s.product.name,
        category: s.product.category,
        price: s.product.price,
        image_url: s.product.image || s.product.image_url || null,
        description: s.product.description,
        score: Number((s.finalScore).toFixed(4)),
        semantic: Number((s.sim).toFixed(4)),
        intentBoost: Number((s.intentBoost).toFixed(4))
      }))
    }

    // Première passe: appliquer budget si fourni
    let filteredScored = applyBudgetFilter(scored, budget)
    let result = sortAndTake(filteredScored)

    // Si aucun résultat, essayer l'élargissement automatique :
    // - si preferredCategories renseignées, chercher produits de ces catégories sans contrainte stricte de mot-clé
    // - sinon, enlever la contrainte budget
    if ((result || []).length === 0) {
      // essaye d'abord sans filtre de mots-clés, mais en privilégiant preferredCategories
      const relaxed = scored
        .map(s => ({ ...s, finalScore: s.finalScore + (isPreferredCategory(s.product) ? 0.15 : 0) }))
      let relaxedFiltered = relaxed
      if (preferredCategories.size > 0) {
        relaxedFiltered = relaxedFiltered.filter(s => isPreferredCategory(s.product) || s.sim > 0)
      }
      relaxedFiltered = applyBudgetFilter(relaxedFiltered, budget)
      result = sortAndTake(relaxedFiltered)
    }

    // Dernier recours : si toujours vide, enlever filtre budget pour proposer quelque chose
    if ((result || []).length === 0 && budget) {
      result = sortAndTake(scored)
    }

    return res.json({
      query: text,
      detectedIntent,
      baseIntent,
      keywords,
      budget: budget || null,
      results: result
    });

  } catch (error) {
    console.error('Recommend error: ', error);
    res.status(500).json({ error: 'Erreur interne lors du calcul des recommandations' });
  }
});

export default router;

/*
Notes (FR):
- Étapes NLP + TF-IDF:
  1) On extrait un "intent" via node-nlp (manager) et on applique des règles simples pour détecter des intents métiers (ex: gift.woman).
  2) On prétraite les produits et on construit un modèle TF-IDF (natural.TfIdf) en ajoutant chaque produit comme document.
  3) On ajoute la requête de l'utilisateur comme dernier document et on transforme chaque document en vecteur terme->tfidf.
  4) On calcule la similarité cosinus entre la requête et chaque produit (sim).
  5) On applique un petit boost si l'intent ou des mots-clés matchent le produit (intentBoost).
  6) Score final = WEIGHT_SEMANTIC * sim + WEIGHT_INTENT * intentBoost. Ajuster ces poids pour favoriser l'une ou l'autre source.

Ajuster les poids:
- Pour favoriser l'intent (si vous faites beaucoup confiance au NLU), augmenter WEIGHT_INTENT et diminuer WEIGHT_SEMANTIC.
- Pour privilégier la similarité sémantique (recommandations plus "sémantiques"), augmenter WEIGHT_SEMANTIC.
*/
