import React from 'react';
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
import CartPage from './pages/Cart';
import Products from './pages/Products';
import ProductView from './pages/ProductView';
import TutorielPage from './pages/Tutoriel';
import { ChatPopup } from './components/ChatPopup';

export default function App() {
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/tutoriel" element={<TutorielPage />} />
        </Routes>
      </Box>
      <BottomNav />
      {/* ChatPopup doit être ici, toujours à l'intérieur du JSX */}
      <ChatPopup />
    </BrowserRouter>
  );
}
