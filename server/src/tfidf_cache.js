import fs from 'fs'
import path from 'path'
import natural from 'natural'

const tokenizer = new natural.WordTokenizer()

// Stopwords list (simple FR list)
const STOPWORDS = new Set(['le','la','les','un','une','et','à','de','du','pour','avec','dans','mon','ma','mes','je','tu','il','elle','nous','vous','des','au','aux','sur','chez','ce','cette','ces','est','sont','que','qui','par','en','se','aujourd','hui'])

let products = []
let productVectors = new Map() // id -> { term: tfidf }
let idf = {} // term -> idf
let df = {} // term -> document frequency
let N = 0

const cacheFile = path.resolve(process.cwd(), 'server', 'data', 'tfidf_cache.json')

const simpleTokens = (text = '') => {
  return tokenizer.tokenize((text || '').toLowerCase()).filter(t => t.length > 1 && !STOPWORDS.has(t))
}

const buildFromProducts = (prods) => {
  products = prods.map(p => ({
    id: p.id,
    name: p.title || p.name || 'Produit',
    description: p.description || '',
    category: (p.category || '').toLowerCase(),
    price: Number(p.price) || 0,
    image: p.image_url || p.product_image || null,
    rawText: `${p.title || p.name || ''} ${p.description || ''} ${(p.category || '')}`
  }))

  // Reset
  df = {}
  idf = {}
  productVectors = new Map()
  N = products.length

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

  // Optionally persist cache to disk for faster startup
  try {
    const dump = {
      products,
      df,
      idf,
      N
    }
    const dir = path.dirname(cacheFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(cacheFile, JSON.stringify(dump), 'utf8')
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
    // restore minimal state; productVectors must still be computed from texts
    products = parsed.products
    df = parsed.df || {}
    idf = parsed.idf || {}
    N = parsed.N || products.length
    // rebuild productVectors from rawText using idf
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
    return true
  } catch (err) {
    console.warn('Failed to load TF-IDF cache from disk:', err.message)
    return false
  }
}

const init = async (dbQuery) => {
  // Try load from disk first
  if (loadCacheFromDisk()) {
    console.log('✅ TF-IDF cache loaded from disk')
    return
  }

  // Otherwise fetch products from DB and build
  try {
    const res = await dbQuery('SELECT p.id, p.title, p.description, p.price, c.name as category, p.image_url FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.price IS NOT NULL')
    const rows = res?.rows || []
    buildFromProducts(rows)
    console.log(`✅ TF-IDF cache built for ${N} products`)
  } catch (err) {
    console.error('Failed to build TF-IDF cache from DB:', err.message)
  }
}

const getProducts = () => products
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

export default {
  init,
  getProducts,
  getProductVectors,
  computeQueryVector,
  getIdf
}
