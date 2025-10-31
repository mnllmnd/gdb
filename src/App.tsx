import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Home from './pages/Home';
import SellerDashboard from './pages/SellerDashboard';
import ShopSetup from './pages/ShopSetup';
import ProductEditor from './pages/ProductEditor';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import MyOrders from './pages/MyOrders';
import SellerShop from './pages/SellerShop';
import SellerOrders from './pages/SellerOrders';
import ShopView from './pages/ShopView';
import Feed from './pages/Feed';
import ReelsPage from './pages/Reels';
import CartPage from './pages/Cart';
import Products from './pages/Products';
import ProductView from './pages/ProductView';
import TutorielPage from './pages/Tutoriel';
import Profile from './pages/Profile';
import { ChatPopup } from './components/ChatPopup';

export default function App() {
  // Clear client-side caches on initial load to avoid stale content
  useEffect(() => {
    try { localStorage.clear() } catch (e) { /* ignore */ }
    try { sessionStorage.clear() } catch (e) { /* ignore */ }

    // Clear CacheStorage (the caches API)
    try {
      if ('caches' in window) {
        caches.keys && caches.keys().then(keys => keys.forEach(k => { try { caches.delete(k) } catch {} }))
      }
    } catch (e) { /* ignore */ }

    // Unregister any service workers
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations && navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => { try { r.unregister() } catch {} }))
        navigator.serviceWorker.getRegistration && navigator.serviceWorker.getRegistration().then(r => { if (r) try { r.unregister() } catch {} })
      }
    } catch (e) { /* ignore */ }

    // Best-effort: remove all IndexedDB databases where the browser exposes the list
    try {
      if ('indexedDB' in window && typeof (indexedDB as any).databases === 'function') {
        ;(indexedDB as any).databases().then((dbs: any[]) => dbs.forEach(d => { try { if (d && d.name) indexedDB.deleteDatabase(d.name) } catch {} })).catch(() => {})
      }
    } catch (e) { /* ignore */ }
  }, [])

  return (
    <BrowserRouter>
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
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/tutoriel" element={<TutorielPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Box>
      <BottomNav />
      {/* ChatPopup doit être ici, toujours à l'intérieur du JSX */}
      <ChatPopup />
    </BrowserRouter>
  );
}
