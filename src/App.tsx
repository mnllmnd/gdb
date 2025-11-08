import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Home from './pages/Home';
import SellerDashboard from './pages/SellerDashboard';
import ShopSetup from './pages/ShopSetup';
import ProductEditor from './pages/ProductEditor';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import MyOrders from './pages/MyOrders';
import SellerShop from './pages/SellerShop';
import SellerOrders from './pages/SellerOrders';
import ShopView from './pages/ShopView';
import Feed from './pages/Feed';
import CartPage from './pages/Cart';
import Products from './pages/Products';
import ProductView from './pages/ProductView';
import TutorielPage from './pages/Tutoriel';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import { ChatPopup } from './components/ChatPopup';

export default function App() {
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
      <InnerApp />
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
      <Box pb={{ base: '96px', md: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/setup" element={<ShopSetup />} />
          <Route path="/seller/shop" element={<SellerShop />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/product/:id?" element={<ProductEditor />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shop/:domain" element={<ShopView />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
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

