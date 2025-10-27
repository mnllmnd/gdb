// Simple in-memory cache for reels listing with TTL

const CACHE = new Map()

export function setCache(key, value, ttlMs = 30 * 1000) {
  const expires = Date.now() + ttlMs
  CACHE.set(key, { value, expires })
}

export function getCache(key) {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { CACHE.delete(key); return null }
  return entry.value
}

export function clearCache(key) {
  if (key) CACHE.delete(key)
  else CACHE.clear()
}

export default { setCache, getCache, clearCache }
