import api from './api'
import { setItem, getItem, removeItem } from '../utils/localAuth'
import cart from '../utils/cart'
import { normalizeSenegalPhone } from '../utils/phone'

export type Role = 'client' | 'seller' | 'admin'

export async function signUpWithPhone(phone: string, password: string, displayName?: string, email?: string) {
  const normalized = normalizeSenegalPhone(phone)
  const res = await api.auth.register({ phone: normalized, email, password, displayName })
  if (res.token) {
    setItem('token', res.token)
    setItem('user', JSON.stringify(res.user))
    if (typeof globalThis !== 'undefined' && globalThis.window) globalThis.window.dispatchEvent(new Event('authChange'))
  }
  return res
}

export async function signInWithPhone(phone: string, password: string) {
  const normalized = normalizeSenegalPhone(phone)
  const res = await api.auth.login({ phone: normalized, password })
  if (res.token) {
    setItem('token', res.token)
    setItem('user', JSON.stringify(res.user))
    if (typeof globalThis !== 'undefined' && globalThis.window) globalThis.window.dispatchEvent(new Event('authChange'))
  }
  return res
}

export async function signInWithGoogle() {
  // Placeholder: implement OAuth flow on backend and redirect if needed
  throw new Error('Google sign-in not implemented in REST backend.');
}

export function signOut() {
  removeItem('token')
  removeItem('user')
  try {
    cart.clear()
  } catch (e) {
    console.error('Failed to clear cart on sign out', e)
  }
  // notify app of auth and cart change
  try { if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') globalThis.dispatchEvent(new Event('authChange')) } catch (e) { /* ignore */ }
  try { if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') globalThis.dispatchEvent(new Event('cart:changed')) } catch (e) { /* ignore */ }
}

export function getCurrentUser() {
  const u = getItem('user')
  return u ? JSON.parse(u) : null
}

export async function promoteUserToAdmin(targetUid: string, token?: string) {
  return api.admin.setRole(targetUid, 'admin', token ?? getItem('token') ?? undefined)
}
