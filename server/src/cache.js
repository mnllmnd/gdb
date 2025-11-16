// Cache module disabled — operating in passthrough mode.
// To simplify and remove in-memory caching, this module now provides
// no-op refresh/invalidate functions and returns empty results for
// in-memory getters so routes fall back to querying the DB directly.

let CACHE_VERSION = Date.now()

const init = async () => {
  CACHE_VERSION = Date.now()
  console.log('⚠️ Cache disabled: init() no-op')
  return false
}

const refresh = async () => {
  CACHE_VERSION = Date.now()
  console.log('⚠️ Cache disabled: refresh() no-op')
  return false
}

const invalidate = async () => {
  CACHE_VERSION = Date.now()
  console.log('⚠️ Cache disabled: invalidate() no-op')
  return true
}

// Accessors return empty results to force DB fallback in routes
const getProducts = () => []
const getProductById = (id) => null
const listProducts = (opts = {}) => []
const getShops = () => []
const getShopByDomain = (domain) => null
const getCategories = () => []

const getStatus = () => ({
  version: CACHE_VERSION,
  age: Date.now() - CACHE_VERSION,
  productsCount: 0,
  shopsCount: 0,
  categoriesCount: 0
})

export default {
  init,
  refresh,
  invalidate,
  getProducts,
  getProductById,
  listProducts,
  getShops,
  getShopByDomain,
  getCategories,
  getStatus
}
