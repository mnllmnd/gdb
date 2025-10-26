// nlp/recommend.js
// Try to use an external GROQ (Sanity) endpoint when credentials are present.
// Fallback to a small local heuristic if GROQ is not configured or the request fails.
import dotenv from 'dotenv'
dotenv.config()

const GROQ_KEY = process.env.groq_api_key || process.env.GROQ_API_KEY || null
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.sanity_project_id || null
const SANITY_DATASET = process.env.SANITY_DATASET || process.env.sanity_dataset || process.env.SANITY_DATASET || null

async function groqQueryProducts(term = '', limit = 3) {
  if (!GROQ_KEY || !SANITY_PROJECT_ID || !SANITY_DATASET) return null
  try {
    const q = String(term || '').replace(/"/g, '\\"')
    // Simple GROQ query: match title/name/description using groq "match" operator
    const groq = `*[_type == "product" && (title match "${q}*" || name match "${q}*" || description match "${q}*")] | order(_updatedAt desc)[0...${limit}]{_id, title, name, price, category, "image_url": image.asset->url}`
    const encoded = encodeURIComponent(groq)
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/${SANITY_DATASET}?query=${encoded}`
    // Diagnostic log (do not print the token itself)
    console.log('[recommend] GROQ request', { project: SANITY_PROJECT_ID, dataset: SANITY_DATASET, url: url.slice(0, 200), tokenLength: GROQ_KEY ? GROQ_KEY.length : 0 })
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Accept': 'application/json'
      }
    })
    if (!res.ok) {
      // Try to parse json body for better error diagnostics without exposing secrets
      const bodyTxt = await res.text().catch(() => '')
      let parsed = null
      try { parsed = JSON.parse(bodyTxt) } catch (e) { parsed = bodyTxt }
      console.warn('GROQ request failed', { status: res.status, body: parsed })
      return null
    }
    const body = await res.json().catch(() => null)
    if (!body || !Array.isArray(body.result)) return null
    // Normalize to expected product shape
    return body.result.map(r => ({
      id: r._id || (r.id || undefined),
      name: r.name || r.title,
      title: r.title || r.name,
      price: r.price,
      category: r.category,
      image_url: r.image_url
    }))
  } catch (err) {
    console.warn('GROQ query error', err.message || err)
    return null
  }
}

const localRecommend = (userProfile = {}, userMessage = '') => {
  const { preferences = [], budget } = userProfile;
  const message = (userMessage || '').toLowerCase();
  
  // Base de données de produits locale (fallback)
  const products = [
    { id: 1, name: 'Lampe Scandinave Blanche', price: 89.99, category: 'décoration' },
    { id: 2, name: 'Chaise Design Eiffel', price: 129.99, category: 'mobilier' },
    { id: 3, name: 'Table Basse Bois Naturel', price: 199.99, category: 'mobilier' },
    { id: 4, name: 'Canapé 3 Places Velours', price: 899.99, category: 'mobilier' },
    { id: 5, name: 'Vase Céramique Artisanal', price: 45.99, category: 'décoration' }
  ];

  let filteredProducts = [...products];

  // Filtrage par mots-clés dans le message
  if (message.includes('lampe') || message.includes('luminaire')) {
    filteredProducts = filteredProducts.filter(p => p.category === 'décoration');
  } else if (message.includes('chaise') || message.includes('siège')) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes('chaise'));
  } else if (message.includes('table')) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes('table'));
  } else if (message.includes('canapé') || message.includes('sofa')) {
    filteredProducts = filteredProducts.filter(p => p.category === 'mobilier' && p.name.toLowerCase().includes('canapé'));
  }

  // Filtrage par budget
  if (budget) {
    filteredProducts = filteredProducts.filter(p => p.price <= budget);
  }

  return filteredProducts.slice(0, 3);
}

const recommend = async (userProfile = {}, userMessage = '') => {
  // Try GROQ first when configured
  const q = (userMessage || '').trim()
  if (GROQ_KEY && SANITY_PROJECT_ID && SANITY_DATASET && q.length > 0) {
    const groqResults = await groqQueryProducts(q, 3)
    if (groqResults && groqResults.length > 0) return groqResults
  }

  // Fallback to local heuristic
  return localRecommend(userProfile, userMessage)
}

export default recommend;