import React, { useEffect, useState } from 'react'
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  HStack,
  Tag,
  Avatar,
  IconButton,
  useBreakpointValue,
  useDisclosure,
  useToast,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  VStack,
  Text,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { signOut, getCurrentUser } from '../services/auth'
import api from '../services/api'
import cart from '../utils/cart'

// Use Times New Roman globally in index.html or via CSS (Times New Roman requested)

export default function NavBar() {
  type User = { display_name?: string; phone?: string; role?: string; id?: string }
  type Shop = { name?: string; logo_url?: string; domain?: string }
  const [isScrolled, setIsScrolled] = useState(false)

  const [user, setUser] = useState<User | null>(getCurrentUser() as User | null)
  const [shop, setShop] = useState<Shop | null>(null)
  const navigate = useNavigate()
  const toast = useToast()
  const showMobileMenu = useBreakpointValue({ base: true, md: false })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [cartCount, setCartCount] = useState<number>(0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function onStorage() {
      setUser(getCurrentUser())
    }
    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener('storage', onStorage)
      function onAuthChange() {
        setUser(getCurrentUser())
      }
      globalThis.addEventListener('authChange', onAuthChange)
      function onCartChange() { setCartCount(cart.list().reduce((s, i) => s + (i.quantity ?? 0), 0)) }
      // init and subscribe
      onCartChange()
      globalThis.addEventListener('cart:changed', onCartChange)
      return () => {
        globalThis.removeEventListener('storage', onStorage)
        globalThis.removeEventListener('authChange', onAuthChange)
        globalThis.removeEventListener('cart:changed', onCartChange)
      }
    }
  }, [])

  // Fetch shop when user changes
  useEffect(() => {
    let mounted = true
    async function loadShop() {
      if (!user) {
        if (mounted) setShop(null)
        return
      }
      try {
          const token = (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage.getItem('token') ?? undefined : undefined
          const s = await api.shops.me(token)
          if (mounted) setShop(s)
        } catch (err) {
          console.error(err)
          if (mounted) setShop(null)
        }
    }
    loadShop()
    return () => { mounted = false }
  }, [user])

  return (
    <Box
      as="nav"
      bg={isScrolled ? 'whiteAlpha.900' : 'transparent'}
      boxShadow={isScrolled ? 'md' : 'none'}
      px={6}
      py={3}
      position="sticky"
      top={0}
      zIndex={999}
      backdropFilter="saturate(180%) blur(6px)"
      transition="background 200ms, box-shadow 200ms"
    >
      <Flex align="center" maxW="1200px" mx="auto">
        <HStack spacing={4} align="center">
          <Avatar size="sm" name="Sama Bitik" />
          <Heading size="md" color="black" fontWeight="700">Sama Bitik</Heading>
          {shop && (
              <Tag as={RouterLink} to="/seller/shop" ml={3} colorScheme="blue" borderRadius="full">
                {shop.name}
              </Tag>
            )}
        </HStack>
        <Spacer />
        {/* Mobile: hamburger opens drawer; Desktop: show actions inline */}
        {showMobileMenu ? (
          <IconButton aria-label="Menu" icon={<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>} onClick={onOpen} ml={4} />
        ) : null}
        {/* Desktop actions (hidden on mobile) */}
        {!showMobileMenu && (
          <HStack spacing={2} align="center">
            <Button as={RouterLink} to="/" variant="ghost" size="md">
              Accueil
            </Button>
            <Button as={RouterLink} to="/products" variant="ghost" size="md">
              Produits
            </Button>
            <Button
              colorScheme="brand"
              ml={2}
              size="md"
              onClick={() => {
                if (user) navigate('/seller')
                else toast({ title: 'Connectez-vous', description: 'Connectez-vous pour accéder à votre boutique', status: 'info' })
              }}
            >
              Ma boutique
            </Button>
            {user?.role === 'admin' && (
              <Button as={RouterLink} to="/admin" variant="ghost" ml={2} size="md">
                Admin
              </Button>
            )}
            {user ? (
              <>
                <Button as={RouterLink} to="/cart" variant="ghost" ml={2} size="md">
                  <HStack spacing={2}>
                    <Text>Panier</Text>
                    {cartCount > 0 && (
                      <Box as="span" bg="red.500" color="white" px={2} py={0} borderRadius="full" fontSize="sm">{cartCount}</Box>
                    )}
                  </HStack>
                </Button>
                <Button as={RouterLink} to="/orders" variant="ghost" ml={2} size="md">Mes commandes</Button>
                <Button
                  ml={2}
                  size="md"
                  onClick={() => {
                    signOut()
                    setUser(null)
                    navigate('/login')
                  }}
                >
                  Se déconnecter
                </Button>
              </>
            ) : (
              <>
                <Button as={RouterLink} to="/login" colorScheme="teal" ml={4} size={{ base: 'sm', md: 'md' }}>
                  Connexion
                </Button>
                <Button as={RouterLink} to="/signup" ml={2} size={{ base: 'sm', md: 'md' }}>
                  S'inscrire
                </Button>
              </>
            )}
          </HStack>
        )}
      </Flex>

      {/* Mobile drawer with actions */}
  <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={3} mt={2}>
              <Button as={RouterLink} to="/" onClick={onClose} variant="ghost" size="sm">Accueil</Button>
              <Button as={RouterLink} to="/products" onClick={onClose} variant="ghost" size="sm">Produits</Button>
              <Button as={RouterLink} to="/cart" onClick={onClose} variant="ghost" size="sm">Panier</Button>
              <Button as={RouterLink} to="/orders" onClick={onClose} variant="ghost" size="sm">Mes commandes</Button>
              <Button onClick={() => { onClose(); if (user) navigate('/seller'); else toast({ title: 'Connectez-vous', description: 'Connectez-vous pour accéder à votre boutique', status: 'info' }) }} colorScheme="brand" size="sm">Mes produits</Button>
              {shop && <Button as={RouterLink} to="/seller/shop" onClick={onClose} size="sm">Ma boutique</Button>}
              {user?.role === 'admin' && <Button as={RouterLink} to="/admin" onClick={onClose} size="sm">Admin</Button>}
              {user ? (
                <>
                  <Button variant="ghost" disabled size="sm">Connecté: {user.display_name ?? user.phone}</Button>
                  <Button size="sm" onClick={() => { onClose(); signOut(); setUser(null); navigate('/login') }}>Se déconnecter</Button>
                </>
              ) : (
                <>
                  <Button as={RouterLink} to="/login" onClick={onClose} size="sm">Connexion</Button>
                  <Button as={RouterLink} to="/signup" onClick={onClose} size="sm">S'inscrire</Button>
                </>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter>
            <Text fontSize="sm" color="black">Marché Sénégal</Text>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
