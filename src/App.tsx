import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { clearInvalidTokens } from './services/auth';
import Home from './pages/Home';
import ProductEditor from './pages/ProductEditor';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import ForgotPasswordOtp from './pages/ForgotPasswordOtp';
import ResetPasswordWithCode from './pages/ResetPasswordWithCode';
import NavBar from './components/NavBar';
import ScrollRestoration from './components/ScrollRestoration';
import BottomNav from './components/BottomNav';
import MyOrders from './pages/MyOrders';
import Feed from './pages/Feed';
import CartPage from './pages/Cart';
import Products from './pages/Products';
import ProductView from './pages/ProductView';
import TutorielPage from './pages/Tutoriel';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import { ChatPopup } from './components/ChatPopup';

export default function App() {
  // Clear invalid tokens on initial load (for backward compatibility after auth system changes)
  useEffect(() => {
    try {
      // Log token and user info for debugging
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token) {
        console.debug('[App] Token found:', token.substring(0, 20) + '...')
        const parts = token.split('.')
        console.debug('[App] Token format valid:', parts.length === 3 ? '✓ JWT' : '✗ Invalid')
      } else {
        console.debug('[App] No token in localStorage')
      }
      if (user) {
        try {
          const parsed = JSON.parse(user)
          console.debug('[App] User found:', parsed.id, parsed.display_name, parsed.role)
        } catch (e) {
          console.warn('[App] User data corrupted:', e)
        }
      } else {
        console.debug('[App] No user in localStorage')
      }
      
      clearInvalidTokens()
    } catch (e) {
      console.warn('Failed to clear invalid tokens', e)
    }
  }, [])

  // Clear client-side caches on initial load to avoid stale content
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token) localStorage.setItem('token', token)
      if (user) localStorage.setItem('user', user)
    } catch (e) { /* ignore */ }

    try {
      if ('caches' in window) {
        caches.keys && caches.keys().then(keys => keys.forEach(k => { try { caches.delete(k) } catch {} }))
      }
    } catch (e) { /* ignore */ }

    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations && navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => { try { r.unregister() } catch {} }))
        navigator.serviceWorker.getRegistration && navigator.serviceWorker.getRegistration().then(r => { if (r) try { r.unregister() } catch {} })
      }
    } catch (e) { /* ignore */ }

    try {
      if ('indexedDB' in window && typeof (indexedDB as any).databases === 'function') {
        ;(indexedDB as any).databases().then((dbs: any[]) => dbs.forEach(d => { try { if (d && d.name) indexedDB.deleteDatabase(d.name) } catch {} })).catch(() => {})
      }
    } catch (e) { /* ignore */ }
  }, [])

  return (
    <BrowserRouter>
      {/* Scroll restoration handles saving/restoring positions on back/forward */}
      <InnerApp />
      {/* mounted inside BrowserRouter so hooks work properly */}
    </BrowserRouter>
  )
}

function InnerApp() {
  const navigate = useNavigate()

  useEffect(() => {
    ;(globalThis as any).handleGlobalSearch = async (q: string) => {
      navigate(`/products?q=${encodeURIComponent(q)}`)
    }
    return () => { (globalThis as any).handleGlobalSearch = undefined }
  }, [navigate])

  return (
    <>
      <NavBar />
      <ScrollRestoration />
      <Box pb={{ base: '96px', md: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password-otp" element={<ForgotPasswordOtp />} />
          <Route path="/reset-password-code" element={<ResetPasswordWithCode />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/seller/product/:id?" element={<ProductEditor />} />
          <Route path="/tutoriel" element={<TutorielPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
      </Box>

      {/* ChatPopup doit être ici, toujours à l'intérieur du JSX */}
      <ChatPopup />
    </>
  )
}

