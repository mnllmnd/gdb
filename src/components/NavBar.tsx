import React, { useEffect, useState } from 'react'
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  HStack,
  
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
  Center,
  VStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { signOut, getCurrentUser } from '../services/auth'
import api from '../services/api'
import cart from '../utils/cart'
import SearchBar from './SearchBar'

export default function NavBar() {
  type User = { display_name?: string; phone?: string; role?: string; id?: string }
  type Shop = { name?: string; logo_url?: string; domain?: string }

  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser() as User | null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [cartCount, setCartCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Utilise la fonction de recherche globale
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    ;(globalThis as any).handleGlobalSearch?.(query)
  }
  
  const navigate = useNavigate()
  const toast = useToast()
  const showMobileMenu = useBreakpointValue({ base: true, md: false })
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // User & cart listeners
  useEffect(() => {
    function onStorage() { setUser(getCurrentUser()) }
    function onAuthChange() { setUser(getCurrentUser()) }
    function onCartChange() { setCartCount(cart.list().reduce((s,i)=>s+(i.quantity??0),0)) }

    globalThis.addEventListener('storage', onStorage)
    globalThis.addEventListener('authChange', onAuthChange)
    globalThis.addEventListener('cart:changed', onCartChange)
    onCartChange() // init

    return () => {
      globalThis.removeEventListener('storage', onStorage)
      globalThis.removeEventListener('authChange', onAuthChange)
      globalThis.removeEventListener('cart:changed', onCartChange)
    }
  }, [])

  // Fetch shop when user changes
  useEffect(() => {
    let mounted = true
    async function loadShop() {
      if (!user) { mounted && setShop(null); return }
      try {
        const token = globalThis.localStorage?.getItem('token') ?? undefined
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
      <Flex align="center" maxW="1200px" mx="auto" justify="space-between">
        {/* Mobile: hamburger + panier */}
        {showMobileMenu ? (
          <HStack spacing={3} width="100%">
            <IconButton
              aria-label="Menu"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                </svg>
              }
              onClick={onOpen}
              className="nav-hamburger"
            />
            <Spacer />
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher..."
            />
            <Box position="relative">
              <IconButton
                as={RouterLink}
                to="/cart"
                aria-label="Panier"
                icon={<span style={{ fontSize: 20 }}>🛒</span>}
                bg="whiteAlpha.900"
                _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
                color="black"
                borderRadius="full"
                boxShadow="md"
              />
              {cartCount > 0 && (
                <Box
                  position="absolute"
                  top={-2}
                  right={-2}
                  bg="red.500"
                  color="white"
                  px={2}
                  py={0}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {cartCount}
                </Box>
              )}
            </Box>
          </HStack>
        ) : (
          // Desktop layout
          <>
            <HStack spacing={4} align="center">
              <Avatar size="sm" name="Sama Bitik" />
              <Heading size="md" color="black" fontWeight="700">Sama Bitik</Heading>
            </HStack>

            <Spacer />

            {/* Desktop actions - Simplified with emojis */}
            <HStack spacing={6} align="center">
              <Button as={RouterLink} to="/" variant="ghost" size="md" leftIcon={<span>🏠</span>}>
                Accueil
              </Button>
              <Button as={RouterLink} to="/products" variant="ghost" size="md" leftIcon={<span>🛍️</span>}>
                Produits
              </Button>
              <Center height="40px">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Rechercher un produit..."
                />
              </Center>
              <Button
                colorScheme="brand"
                size="md"
                onClick={() => {
                  if (user) navigate('/seller')
                  else toast({ 
                    title: '✨ Créez votre boutique', 
                    description: 'Rejoignez notre communauté de vendeurs !', 
                    status: 'info',
                    duration: 5000,
                  })
                }}
                className="nav-my-shop"
                leftIcon={<span>🏪</span>}
              >
                Vendre
              </Button>
              {user?.role === 'admin' && (
                <Button as={RouterLink} to="/admin" variant="ghost" ml={2} size="md">Admin</Button>
              )}
              <Box position="relative">
                <IconButton
                  as={RouterLink}
                  to="/cart"
                  aria-label="Panier"
                  icon={<span style={{ fontSize: 24 }}>🛒</span>}
                  variant="ghost"
                  size="lg"
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="transform 0.2s"
                />
                {cartCount > 0 && (
                  <Box
                    position="absolute"
                    top={-1}
                    right={-1}
                    bg="red.500"
                    color="white"
                    px={2}
                    py={0}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                    animation="pulse 2s infinite"
                  >
                    {cartCount}
                  </Box>
                )}
              </Box>
              {user ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="ghost"
                    _hover={{ bg: 'whiteAlpha.800' }}
                  >
                    <HStack>
                      <Avatar size="xs" name={user.display_name ?? user.phone} />
                      <Text>{user.display_name ?? 'Mon compte'}</Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/orders" icon={<span>📦</span>}>
                      Mes commandes
                    </MenuItem>
                    {shop && (
                      <MenuItem as={RouterLink} to="/seller/shop" icon={<span>🏪</span>}>
                        Ma boutique
                      </MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem onClick={() => { signOut(); setUser(null); navigate('/login') }} icon={<span>👋</span>}>
                      Se déconnecter
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme="brand"
                  size="md"
                  leftIcon={<span>✨</span>}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="transform 0.2s"
                >
                  Commencer
                </Button>
              )}
            </HStack>
          </>
        )}
      </Flex>

      {/* Mobile drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={2}>
              <Avatar size="sm" name="Sama Bitik" />
              <Heading size="md" color="black" fontWeight="700">Sama Bitik</Heading>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4} mt={2}>
              <Button as={RouterLink} to="/" onClick={onClose} variant="ghost" size="md" leftIcon={<span>🏠</span>}>
                Accueil
              </Button>
              <Button as={RouterLink} to="/products" onClick={onClose} variant="ghost" size="md" leftIcon={<span>🛍️</span>}>
                Découvrir
              </Button>
              <Button as={RouterLink} to="/tutoriel" onClick={onClose} variant="ghost" size="md" leftIcon={<span>📚</span>} className="nav-tutoriel">
                Tutoriel
              </Button>
              <Button as={RouterLink} to="/cart" onClick={onClose} variant="ghost" size="md" leftIcon={<span>🛒</span>}>
                Mon panier {cartCount > 0 && `(${cartCount})`}
              </Button>
              {user && (
                <Button as={RouterLink} to="/orders" onClick={onClose} variant="ghost" size="md" leftIcon={<span>📦</span>}>
                  Mes commandes
                </Button>
              )}
              <Button
                onClick={() => {
                  onClose()
                  if (user) navigate('/seller')
                  else toast({ 
                    title: '✨ Créez votre boutique', 
                    description: 'Rejoignez notre communauté de vendeurs !',
                    status: 'info',
                    duration: 5000
                  })
                }}
                colorScheme="brand" 
                size="md"
                leftIcon={<span>🏪</span>}
              >
                Vendre
              </Button>
              {shop && <Button as={RouterLink} to="/seller/shop" onClick={onClose} size="sm" className="nav-my-shop">Ma boutique</Button>}
              {user?.role === 'admin' && <Button as={RouterLink} to="/admin" onClick={onClose} size="sm">Admin</Button>}
              {user ? (
                <>
                  <Button variant="ghost" disabled size="sm">Connecté: {user.display_name ?? user.phone}</Button>
                  <Button size="sm" onClick={() => { onClose(); signOut(); setUser(null); navigate('/login') }}>Se déconnecter</Button>
                </>
              ) : (
                <>
                  <Button as={RouterLink} to="/login" onClick={onClose} size="sm" className="nav-login">Connexion</Button>
                  <Button as={RouterLink} to="/signup" onClick={onClose} size="sm" className="nav-signup">S'inscrire</Button>
                </>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter>
            <Text fontSize="sm" color="black">Dalal ak jamm</Text>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
