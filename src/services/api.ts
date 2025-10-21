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
  const headers = options.headers ? { 'Content-Type': 'application/json', ...options.headers } : { 'Content-Type': 'application/json' }
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
    create: (payload: any, token?: string) =>
      request('/products', { method: 'POST', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    update: (id: string, payload: any, token?: string) =>
      request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    delete: (id: string, token?: string) => request(`/products/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  },
  uploads: {
    uploadFile: async (file: File, token?: string) => {
      const form = new FormData()
      form.append('file', file)
  const headersVar: Record<string, string> | undefined = token ? { Authorization: `Bearer ${token}` } : undefined
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
  },
  admin: {
    users: (token?: string) => request('/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    setRole: (id: string, role: string, token?: string) =>
      request(`/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }), headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  },
}

export default api
