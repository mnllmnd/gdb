// Simple SVG placeholders as data URLs to avoid missing static assets in builds
export const PLACEHOLDER_SVG = (label = 'Image') =>
  `data:image/svg+xml;utf8,` + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' alignment-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='36' font-family='Arial, Helvetica, sans-serif'>${label}</text>
  </svg>`)

export const PRODUCT_PLACEHOLDER = PLACEHOLDER_SVG('Produit')
export const SHOP_PLACEHOLDER = PLACEHOLDER_SVG('Boutique')

export function highRes(url: string | undefined, options?: { width?: number, quality?: number }): string | undefined {
  if (!url) return undefined
  try {
    // Try to construct a URL. If the provided url is relative (like '/uploads/..')
    // new URL(url) will throw — in browser we can resolve relative to location.origin.
    let u: URL
    try {
      u = new URL(url)
    } catch (err) {
      if (typeof window !== 'undefined' && window.location) {
        // resolve relative URL against the current origin
        u = new URL(url, window.location.origin)
      } else {
        // not in browser (or cannot resolve) — return the raw url and avoid transforming
        return url
      }
    }

    if (u.hostname.includes('res.cloudinary.com')){
      // example: https://res.cloudinary.com/<cloud>/image/upload/v123/.../file.jpg
      // insert /q_{quality},w_{width},f_auto after /upload
      const parts = u.pathname.split('/upload/')
      const transform: string[] = []
      if (options?.quality) transform.push(`q_${options.quality}`)
      if (options?.width) transform.push(`w_${options.width}`)
      // ensure format auto for best results
      transform.push('f_auto')
      const t = transform.join(',')
      if (parts.length === 2) {
        return `${u.protocol}//${u.host}${parts[0]}/upload/${t}/${parts[1]}`
      }
    }
    // Not a Cloudinary URL — return original (resolved) string so <img> can load it.
    return u.toString()
  } catch(error_) {
    console.warn('highRes: invalid url', error_)
    return undefined
  }
}
