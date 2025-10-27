// Normalize the API base so values like ':4000/api' (missing host/protocol)
// become a valid absolute URL (http://localhost:4000/api). Also remove
// an accidental trailing slash to keep concatenation predictable.
const rawBase: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
let apiBase: string = rawBase.trim()
// If env provides something like ":4000/api" prepend localhost
if (apiBase.startsWith(':')) apiBase = `http://localhost${apiBase}`
// Ensure we have a protocol; if not, treat as localhost
if (!/^https?:\/\//i.test(apiBase)) apiBase = `http://${apiBase}`
// remove trailing slash for consistent concatenation
apiBase = apiBase.replace(/\/$/, '')
// Ensure apiBase targets the API root (add /api if caller provided a host without it)
if (!apiBase.endsWith('/api')) {
  apiBase = apiBase + '/api'
}

// Export a constant API_BASE and API_ROOT for components that need direct URLs
export const API_BASE = apiBase
export const API_ROOT = API_BASE.replace(/\/api$/, '')

type ReqOptions = {
  method?: string
  headers?: Record<string, string>
  body?: string
}

async function request(path: string, options: ReqOptions = {}) {
  // Build headers, prefer explicit headers passed in options but fill in Authorization from localStorage when missing
  const headers: Record<string, string> = { ...(options.headers || {}) }
  try {
    const maybeToken = (globalThis as any)?.localStorage?.getItem?.('token')
    if (maybeToken && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${maybeToken}`
    }
  } catch (e) {
    // ignore if localStorage not available
  }

  // Only set Content-Type for non-FormData bodies (fetch will set correct multipart boundary for FormData)
  const maybeBody: any = (options as any).body
  const isFormData = maybeBody && typeof maybeBody === 'object' && typeof maybeBody.append === 'function'
  if (options.body && !isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const res = await fetch(apiBase + path, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'unknown' }))
    throw err
  }
  return res.json().catch(() => null)
}

export const api = {
  auth: {
    register: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  },
  categories: {
    list: () => request('/categories'),
    getProducts: (categoryId: number) => request(`/categories/${categoryId}/products`),
  },
  products: {
    list: () => request('/products'),
    getLikes: (id: string, token?: string) => request(`/products/${id}/likes`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    create: (payload: any, token?: string) =>
      request('/products', { method: 'POST', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    update: (id: string, payload: any, token?: string) =>
      request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    delete: (id: string, token?: string) => request(`/products/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    like: (id: string, token?: string) => request(`/products/${id}/like`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    unlike: (id: string, token?: string) => request(`/products/${id}/like`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  },
  uploads: {
    uploadFile: async (file: File, token?: string) => {
      const form = new FormData()
      form.append('file', file)
      // prefer explicit token param, otherwise fall back to localStorage
      const tokenVal = token ?? ((globalThis as any)?.localStorage?.getItem?.('token'))
      const headersVar: Record<string, string> | undefined = tokenVal ? { Authorization: `Bearer ${tokenVal}` } : undefined
      const res = await fetch(API_BASE + '/uploads', { method: 'POST', body: form, headers: headersVar })
      if (!res.ok) throw await res.json().catch(() => ({ error: 'upload_failed' }))
      return res.json()
    },
  },
  orders: {
    create: (payload: any, token?: string) => request('/orders', { method: 'POST', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    my: (token?: string) => request('/orders/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    cancel: (orderId: string, token?: string) => request(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    delete: (orderId: string, token?: string) => request(`/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  },
  shops: {
    list: () => request('/shops'),
    me: (token?: string) => request('/shops/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    save: (payload: any, token?: string) => request('/shops', { method: 'POST', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    byDomain: (domain: string) => request(`/shops/domain/${encodeURIComponent(domain)}`),
    orders: (token?: string) => request('/shops/me/orders', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    clients: (token?: string) => request('/shops/me/clients', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    debts: {
      list: (token?: string) => request('/shops/me/debts', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      add: (entry: any, token?: string) => request('/shops/me/debts', { method: 'POST', body: JSON.stringify({ entry }), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    },
    delete: (id: string, token?: string) => request(`/shops/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    // Seller: delete a specific order received for this seller's product
    deleteOrder: (orderId: string, token?: string) => request(`/shops/me/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    // Public: search shops by query (name or product title)
    search: (q: string) => request(`/shops/search?q=${encodeURIComponent(q)}`),
    popular: () => request(`/shops/popular`),
  // Follow/unfollow and status
  follow: (id: string, token?: string) => request(`/shops/${id}/follow`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  unfollow: (id: string, token?: string) => request(`/shops/${id}/follow`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  followStatus: (id: string, token?: string) => request(`/shops/${id}/follow_status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  followers: (id: string) => request(`/shops/${id}/followers`),
  following: (token?: string) => request('/shops/me/following', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  },
  recommend: {
    find: (payload: any) => request('/recommend', { method: 'POST', body: JSON.stringify(payload) })
  },
  feed: {
    list: (page = 1, limit = 20, token?: string) => request(`/feed?limit=${encodeURIComponent(String(limit))}&page=${encodeURIComponent(String(page))}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  },
  reels: {
    list: (opts: any = {}) => {
      const qs = []
      if (opts.product_id) qs.push(`product_id=${encodeURIComponent(String(opts.product_id))}`)
      if (opts.page) qs.push(`page=${encodeURIComponent(String(opts.page))}`)
      if (opts.limit) qs.push(`limit=${encodeURIComponent(String(opts.limit))}`)
      const q = qs.length ? `?${qs.join('&')}` : ''
      return request(`/reels${q}`, { headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {} })
    },
    get: (id: string, token?: string) => request(`/reels/${encodeURIComponent(id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    // Fetch comments for a reel (optional pagination)
    getComments: (id: string, page = 1, limit = 50, token?: string) =>
      request(`/reels/${encodeURIComponent(id)}/comments?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    like: (id: string, token?: string) => request(`/reels/${encodeURIComponent(id)}/like`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    comment: (id: string, body: any, token?: string) => request(`/reels/${encodeURIComponent(id)}/comments`, { method: 'POST', body: JSON.stringify(body), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    upload: (payload: any, token?: string) => request(`/reels/upload`, { method: 'POST', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  delete: (id: string, token?: string) => request(`/reels/${encodeURIComponent(id)}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    uploadFile: async (file: File, fields: any = {}, token?: string) => {
      const form = new FormData()
      form.append('reel', file)
      Object.entries(fields || {}).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, String(v)) })
      const tokenVal = token ?? ((globalThis as any)?.localStorage?.getItem?.('token'))
      const headersVar: Record<string, string> | undefined = tokenVal ? { Authorization: `Bearer ${tokenVal}` } : undefined
      const res = await fetch(API_BASE + '/reels/upload', { method: 'POST', body: form, headers: headersVar })
      if (!res.ok) throw await res.json().catch(() => ({ error: 'upload_failed' }))
      return res.json()
    }
  },
  user: {
    myLikes: (token?: string) => request('/auth/me/likes', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  },
  admin: {
    users: (token?: string) => request('/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    setRole: (id: string, role: string, token?: string) =>
      request(`/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    // Create a new user (admin)
    createUser: (payload: any, token?: string) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    // Delete a user by id (admin)
    deleteUser: (id: string, token?: string) => request(`/admin/users/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  },
}

export default api
