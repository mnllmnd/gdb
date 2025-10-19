type CartItem = {
  id: string
  title: string
  price: number | null
  quantity: number
  image?: string | null
}

const KEY = 'cart_items_v1'

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read cart', e)
    return []
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
    // dispatch a storage event for same-tab listeners
    // best-effort notify listeners in this window/tab
    if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
      globalThis.dispatchEvent(new Event('cart:changed'))
    }
  } catch (e) {
    console.error('Failed to write cart', e)
  }
}

export function list(): CartItem[] {
  return read()
}

export function add(item: { id: string; title: string; price?: number | null; image?: string | null }, qty = 1) {
  const items = read()
  const existing = items.find((i) => String(i.id) === String(item.id))
  if (existing) {
    existing.quantity = Math.max(1, existing.quantity + qty)
  } else {
    items.push({ id: item.id, title: item.title, price: item.price ?? null, quantity: Math.max(1, qty), image: item.image ?? null })
  }
  write(items)
}

export function updateQuantity(id: string, quantity: number) {
  const items = read()
  const idx = items.findIndex((i) => String(i.id) === String(id))
  if (idx === -1) return
  if (quantity <= 0) items.splice(idx, 1)
  else items[idx].quantity = quantity
  write(items)
}

export function remove(id: string) {
  const items = read().filter((i) => String(i.id) !== String(id))
  write(items)
}

export function clear() {
  try {
    localStorage.removeItem(KEY)
    if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
      globalThis.dispatchEvent(new Event('cart:changed'))
    }
  } catch (e) {
    console.error(e)
  }
}

export function getTotal() {
  const items = read()
  return items.reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0)
}

export default { list, add, updateQuantity, remove, clear, getTotal }
