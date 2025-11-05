import fs from 'fs'
import path from 'path'
import natural from 'natural'

const tokenizer = new natural.WordTokenizer()

// Stopwords list (simple FR list)
const STOPWORDS = new Set(['le','la','les','un','une','et','à','de','du','pour','avec','dans','mon','ma','mes','je','tu','il','elle','nous','vous','des','au','aux','sur','chez','ce','cette','ces','est','sont','que','qui','par','en','se','aujourd','hui'])

let products = []
let productVectors = new Map()
let idf = {}
let df = {}
let N = 0
let lastUpdate = 0
let dbQueryFn = null

const cacheFile = path.resolve(process.cwd(), 'server', 'data', 'tfidf_cache.json')

const simpleTokens = (text = '') => {
  return tokenizer.tokenize((text || '').toLowerCase()).filter(t => t.length > 1 && !STOPWORDS.has(t))
}

const buildFromProducts = (prods) => {
  products = prods.map(p => ({
    id: p.id,
    name: p.title || 'Produit',
    description: p.description || '',
    category: (p.category || '').toLowerCase(),
    price: Number(p.price) || 0,
    quantity: Number(p.quantity) || 0,
    image: p.image_url || null,
    seller_id: p.seller_id,
    rawText: `${p.title || ''} ${p.description || ''} ${(p.category || '')}`.trim(),
    updated_at: p.updated_at
  }))

  // Reset
  df = {}
  idf = {}
  productVectors = new Map()
  N = products.length
  lastUpdate = Date.now()

  // First pass: compute term counts and document frequencies
  const docsTerms = []
  for (const p of products) {
    const toks = simpleTokens(p.rawText)
    const counts = {}
    for (const t of toks) counts[t] = (counts[t] || 0) + 1
    const uniq = new Set(Object.keys(counts))
    for (const t of uniq) df[t] = (df[t] || 0) + 1
    docsTerms.push({ id: p.id, counts, total: toks.length })
  }

  // Compute idf with smoothing
  for (const [term, docFreq] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (docFreq + 1)) + 1
  }

  // Second pass: compute tf-idf vectors
  for (const doc of docsTerms) {
    const vec = {}
    for (const [t, cnt] of Object.entries(doc.counts)) {
      const tf = doc.total > 0 ? cnt / doc.total : 0
      vec[t] = tf * (idf[t] || 0)
    }
    productVectors.set(doc.id, vec)
  }

  // Persist cache to disk
  try {
    const dump = {
      products,
      df,
      idf,
      N,
      lastUpdate
    }
    const dir = path.dirname(cacheFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(cacheFile, JSON.stringify(dump), 'utf8')
    console.log(`✅ TF-IDF cache updated with ${N} products`)
  } catch (err) {
    console.warn('Could not persist TF-IDF cache:', err.message)
  }
}

const loadCacheFromDisk = () => {
  try {
    if (!fs.existsSync(cacheFile)) return false
    const raw = fs.readFileSync(cacheFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.products)) return false
    
    products = parsed.products
    df = parsed.df || {}
    idf = parsed.idf || {}
    N = parsed.N || products.length
    lastUpdate = parsed.lastUpdate || 0

    // Rebuild productVectors from rawText using idf
    for (const p of products) {
      const toks = simpleTokens(p.rawText)
      const counts = {}
      for (const t of toks) counts[t] = (counts[t] || 0) + 1
      const vec = {}
      const total = toks.length
      for (const [t, cnt] of Object.entries(counts)) {
        vec[t] = (total > 0 ? cnt / total : 0) * (idf[t] || Math.log((N + 1) / 1) + 1)
      }
      productVectors.set(p.id, vec)
    }
    
    console.log(`✅ TF-IDF cache loaded from disk (${N} products, updated: ${new Date(lastUpdate).toLocaleString()})`)
    return true
  } catch (err) {
    console.warn('Failed to load TF-IDF cache from disk:', err.message)
    return false
  }
}

// Vérifie si le cache doit être rafraîchi (plus de 5 minutes ou produits manquants)
const shouldRefreshCache = async () => {
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  // Rafraîchir si le cache a plus de 5 minutes
  if (now - lastUpdate > fiveMinutes) {
    console.log('🔄 Cache needs refresh (older than 5 minutes)')
    return true
  }

  // Vérifier si des nouveaux produits existent dans la base
  try {
    const dbProducts = await dbQueryFn(`
      SELECT id, updated_at 
      FROM products 
      WHERE price IS NOT NULL 
        AND quantity > 0
      ORDER BY updated_at DESC 
      LIMIT 1
    `)
    if (!dbProducts?.rows?.length) return false
    
    const latestDbProduct = dbProducts.rows[0]
    const cachedProduct = products.find(p => p.id === latestDbProduct.id)
    
    // Si le dernier produit n'est pas dans le cache OU a été modifié récemment
    if (!cachedProduct) {
      console.log('🔄 Cache needs refresh (new products detected)')
      return true
    }
    
    // Comparaison des dates
    const dbTime = new Date(latestDbProduct.updated_at).getTime()
    const cacheTime = new Date(cachedProduct.updated_at).getTime()
    if (dbTime > cacheTime) {
      console.log('🔄 Cache needs refresh (updated products detected)')
      return true
    }
  } catch (err) {
    console.warn('Could not check for new products:', err.message)
    // En cas d'erreur, on rafraîchit par précaution
    return true
  }

  return false
}

// Rafraîchit le cache depuis la base de données
const refreshCache = async () => {
  if (!dbQueryFn) {
    console.warn('Cannot refresh cache: no database query function')
    return false
  }

  try {
    console.log('🔄 Refreshing TF-IDF cache from database...')
    const res = await dbQueryFn(`
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.price,
        p.updated_at,
        p.quantity,
        p.image_url,
        p.seller_id,
        c.name as category,
        p.title_clean
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.price IS NOT NULL
        AND p.quantity > 0  -- Seulement les produits en stock
      ORDER BY p.updated_at DESC
    `)
    const rows = res?.rows || []
    
    if (rows.length > 0) {
      buildFromProducts(rows)
      return true
    }
  } catch (err) {
    console.error('Failed to refresh TF-IDF cache from DB:', err.message)
    return false
  }
  
  return false
}

const init = async (dbQuery) => {
  dbQueryFn = dbQuery
  
  // Try load from disk first
  if (loadCacheFromDisk()) {
    // Vérifier si on doit rafraîchir le cache après le chargement
    if (await shouldRefreshCache()) {
      await refreshCache()
    }
    return
  }

  // Otherwise fetch products from DB and build
  try {
    const res = await dbQuery(`
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.price,
        p.updated_at,
        p.quantity,
        p.image_url,
        p.seller_id,
        c.name as category,
        p.title_clean
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.price IS NOT NULL
        AND p.quantity > 0
      ORDER BY p.updated_at DESC
    `)
    const rows = res?.rows || []
    buildFromProducts(rows)
  } catch (err) {
    console.error('Failed to build TF-IDF cache from DB:', err.message)
  }
}

// Fonction pour forcer le rafraîchissement manuel
const forceRefresh = async () => {
  if (!dbQueryFn) {
    console.warn('Cannot force refresh: no database query function')
    return false
  }
  return await refreshCache()
}

// Fonction de recherche avec vérification automatique du cache
const searchWithCacheCheck = async (query, limit = 20) => {
  // Vérifier si le cache doit être rafraîchi
  if (await shouldRefreshCache()) {
    await refreshCache()
  }

  return search(query, limit)
}

// Fonction de recherche originale
const search = (query, limit = 20) => {
  if (!query?.trim() || products.length === 0) {
    return products.slice(0, limit)
  }

  const queryVec = computeQueryVector(query)
  const scores = []

  for (const p of products) {
    const pVec = productVectors.get(p.id) || {}
    let score = 0
    for (const [term, qWeight] of Object.entries(queryVec)) {
      score += qWeight * (pVec[term] || 0)
    }
    if (score > 0) scores.push({ product: p, score })
  }

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, limit).map(s => s.product)
}

const getProducts = () => [...products]
const getProductVectors = () => productVectors
const computeQueryVector = (text = '') => {
  const toks = simpleTokens(text)
  const counts = {}
  for (const t of toks) counts[t] = (counts[t] || 0) + 1
  const total = toks.length
  const vec = {}
  for (const [t, cnt] of Object.entries(counts)) {
    const termIdf = idf[t] || Math.log((N + 1) / 1) + 1
    vec[t] = (total > 0 ? cnt / total : 0) * termIdf
  }
  return vec
}

const getIdf = () => idf
const getCacheInfo = () => ({
  productCount: N,
  lastUpdate: new Date(lastUpdate),
  cacheAge: Date.now() - lastUpdate
})

export default {
  init,
  getProducts,
  getProductVectors,
  computeQueryVector,
  getIdf,
  search: searchWithCacheCheck, // Utiliser la version avec vérification de cache
  forceRefresh,
  getCacheInfo,
  // Export original search for internal use
  _search: search
}