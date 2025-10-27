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
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  Portal,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { signOut, getCurrentUser } from '../services/auth'
import api from '../services/api'
import cart from '../utils/cart'
import SearchBar from './SearchBar'
import Recommendations from './Recommendations'

export default function NavBar() {
  type User = { display_name?: string; phone?: string; role?: string; id?: string }
  type Shop = { name?: string; logo_url?: string; domain?: string }

  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser() as User | null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [cartCount, setCartCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Couleurs harmonieuses
  // Le header doit utiliser la couleur demandée (#D1B7A1) en mode clair.
  // En mode sombre on conserve le gris foncé par défaut.
  const navBg = useColorModeValue('#D1B7A1', 'gray.900')
  const navBorder = useColorModeValue('gray.100', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300')
  const brandColor = useColorModeValue('brand.500', 'brand.500')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const menuBg = useColorModeValue('white', 'gray.800')
  const menuBorder = useColorModeValue('gray.200', 'gray.600')
  
  // Utilise la fonction de recherche globale
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    ;(globalThis as any).handleGlobalSearch?.(query)
  }
  
  const navigate = useNavigate()
  const toast = useToast()
  const showMobileMenu = useBreakpointValue({ base: true, md: false })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const recRef = React.useRef<any>(null)

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
      if (!user || user.role !== 'seller') { 
        mounted && setShop(null)
        return 
      }
      try {
        const token = globalThis.localStorage?.getItem('token') ?? undefined
        const s = await api.shops.me(token)
        if (mounted) setShop(s)
      } catch (err: any) {
        if (err?.error !== 'No shop' && mounted) {
          toast({
            title: "Error loading shop",
            description: "Please try again later",
            status: "error",
            duration: 3000,
            isClosable: true,
          })
        }
        if (mounted) setShop(null)
      }
    }
    loadShop()
    return () => { mounted = false }
  }, [user, toast])

  return (
    <Box
      as="nav"
      bg={isScrolled ? navBg : 'transparent'}
      borderBottom={isScrolled ? '1px solid' : 'none'}
      borderColor={navBorder}
      boxShadow={isScrolled ? 'sm' : 'none'}
      px={6}
      py={3}
      position="sticky"
      top={0}
      zIndex={1400} // Z-index très élevé pour la navbar
      backdropFilter="saturate(180%) blur(10px)"
      transition="all 0.3s ease"
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
              color={textColor}
              variant="ghost"
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
                color={textColor}
                borderRadius="full"
                boxShadow="sm"
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
                  boxShadow="sm"
                  zIndex={1500} // Au-dessus de tout
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
              <Avatar size="sm" name="Sama Bitik" bg={brandColor} color="white" />
              <Heading size="md" color={textColor} fontWeight="800">Sama Bitik</Heading>
            </HStack>

            <Spacer />

            {/* Desktop actions */}
            <HStack spacing={6} align="center">
              <Button 
                as={RouterLink} 
                to="/" 
                variant="ghost" 
                size="md" 
                leftIcon={<span>🏠</span>} 
                color={textColor}
                _hover={{ bg: hoverBg, color: brandColor }}
              >
                Accueil
              </Button>
              <Button 
                as={RouterLink} 
                to="/products" 
                variant="ghost" 
                size="md" 
                leftIcon={<span>🛍️</span>} 
                color={textColor}
                _hover={{ bg: hoverBg, color: brandColor }}
              >
                Produits
              </Button>
              <Button 
                as={RouterLink}
                to="/feed"
                variant="ghost"
                size="md"
                leftIcon={<span>🔥</span>}
                color={textColor}
                _hover={{ bg: hoverBg, color: brandColor }}
              >
                Fil
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
                bg={brandColor}
                color="white"
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
                _hover={{ 
                  bg: 'brand.700',
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
                transition="all 0.2s ease"
              >
                Vendre
              </Button>
              
              {user?.role === 'admin' && (
                <Button 
                  as={RouterLink} 
                  to="/admin" 
                  variant="ghost" 
                  ml={2} 
                  size="md" 
                  color={textColor}
                  _hover={{ bg: hoverBg, color: brandColor }}
                >
                  Admin
                </Button>
              )}
              <Box position="relative">
                <IconButton
                  as={RouterLink}
                  to="/cart"
                  aria-label="Panier"
                  icon={<span style={{ fontSize: 24 }}>🛒</span>}
                  variant="ghost"
                  color={textColor}
                  size="lg"
                  _hover={{ 
                    bg: hoverBg, 
                    color: brandColor,
                    transform: 'scale(1.1)' 
                  }}
                  transition="all 0.2s ease"
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
                    boxShadow="sm"
                    animation="pulse 2s infinite"
                    zIndex={1500} // Au-dessus de tout
                  >
                    {cartCount}
                  </Box>
                )}
              </Box>
              {user ? (
                <Menu placement="bottom-end">
                 {/* Desktop: quick upload reel button near user menu */}
                 <IconButton
                   as={RouterLink}
                   to="/reels?upload=1"
                   aria-label="Poster un Reel"
                   icon={<span style={{ fontSize: 18 }}>🎬</span>}
                   variant="ghost"
                   color={textColor}
                   size="md"
                   _hover={{ bg: hoverBg, color: brandColor }}
                 />
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    _expanded={{ bg: hoverBg }}
                    px={3}
                    py={2}
                    borderRadius="lg"
                  >
                    <HStack spacing={2}>
                      <Avatar 
                        size="sm" 
                        name={user.display_name ?? user.phone} 
                        bg={brandColor}
                        color="white"
                        fontSize="xs"
                      />
                      <VStack spacing={0} align="start">
                        <Text fontSize="sm" fontWeight="600">
                          {user.display_name || 'Mon compte'}
                        </Text>
                        {shop && (
                          <Text fontSize="xs" color={subtleTextColor}>
                            Vendeur
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </MenuButton>
                  {/* Utilisation de Portal pour forcer le menu au-dessus de tout */}
                  <Portal>
                    <MenuList 
                      bg={menuBg} 
                      borderColor={menuBorder}
                      boxShadow="2xl"
                      borderRadius="xl"
                      py={2}
                      minW="240px"
                      zIndex={1600} // Z-index très élevé
                      position="relative"
                    >
                      <MenuItem 
                        as={RouterLink} 
                        to="/profile" 
                        icon={<span style={{ fontSize: '16px' }}>👤</span>}
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        py={3}
                        onClick={onClose}
                      >
                        Mon profil
                      </MenuItem>
                      <MenuItem 
                        as={RouterLink} 
                        to="/orders" 
                        icon={<span style={{ fontSize: '16px' }}>📦</span>}
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        py={3}
                        onClick={onClose}
                      >
                        Mes commandes
                      </MenuItem>
                      {shop && (
                        <MenuItem 
                          as={RouterLink} 
                          to="/seller/shop" 
                          icon={<span style={{ fontSize: '16px' }}>🏪</span>}
                          color={textColor}
                          _hover={{ bg: hoverBg }}
                          py={3}
                          onClick={onClose}
                        >
                          Ma boutique
                        </MenuItem>
                      )}
                      <MenuDivider borderColor={menuBorder} />
                      <MenuItem 
                        onClick={() => { 
                          signOut(); 
                          setUser(null); 
                          navigate('/login');
                          toast({
                            title: "À bientôt !",
                            description: "Vous avez été déconnecté avec succès",
                            status: "info",
                            duration: 3000,
                          })
                        }} 
                        icon={<span style={{ fontSize: '16px' }}>👋</span>}
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        py={3}
                      >
                        Se déconnecter
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              ) : (
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme="brand"
                  size="md"
                  bg={brandColor}
                  color="white"
                  leftIcon={<span>✨</span>}
                  _hover={{ 
                    bg: 'brand.700',
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  transition="all 0.2s ease"
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
        <DrawerContent bg={menuBg} zIndex={1700}> {/* Z-index très élevé pour le drawer */}
          <DrawerHeader borderBottomWidth="1px" borderColor={menuBorder}>
            <HStack spacing={2}>
              <Avatar size="sm" name="Sama Bitik" bg={brandColor} color="white" />
              <Heading size="md" color={textColor} fontWeight="800">Sama Bitik</Heading>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={2} mt={2}>
              {/* Client section */}
              <Box px={3} py={2}>
                <Text fontSize="sm" color={subtleTextColor} fontWeight="600">Client</Text>
              </Box>
              <Button 
                as={RouterLink} 
                to="/" 
                onClick={onClose} 
                variant="ghost" 
                size="md" 
                leftIcon={<span>🏠</span>} 
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
              >
                Accueil
              </Button>
              <Button 
                as={RouterLink} 
                to="/products" 
                onClick={onClose} 
                variant="ghost" 
                size="md" 
                leftIcon={<span>🛍️</span>} 
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
              >
                Découvrir
              </Button>
              <Button
                onClick={() => {
                  onClose()
                  // Open recommendations modal from sidebar
                  setTimeout(() => recRef.current?.open?.(), 150)
                }}
                variant="ghost"
                size="md"
                leftIcon={<span>🔎</span>}
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
              >
                Tu cherches?
              </Button>
              {user && (
                <Button 
                  as={RouterLink} 
                  to="/orders" 
                  onClick={onClose} 
                  variant="ghost" 
                  size="md" 
                  leftIcon={<span>📦</span>} 
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                >
                  Mes commandes
                </Button>
              )}
              {user && (
                <Button
                  as={RouterLink}
                  to="/profile"
                  onClick={onClose}
                  variant="ghost"
                  size="md"
                  leftIcon={<span>👤</span>}
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                >
                  Mon profil
                </Button>
              )}
              <Button 
                as={RouterLink} 
                to="/tutoriel" 
                onClick={onClose} 
                variant="ghost" 
                size="md" 
                leftIcon={<span>📚</span>} 
                className="nav-tutoriel" 
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
              >
                Tutoriel
              </Button>

              {/* Auth actions (client) */}
              {user ? (
                <>
                  <Box px={3} py={2}>
                    <Text fontSize="sm" color={subtleTextColor}>Connecté en tant que</Text>
                    <Text fontSize="md" fontWeight="600" color={textColor}>
                      {user.display_name ?? user.phone}
                    </Text>
                  </Box>
                 
                </>
              ) : (
                <>
                 
                </>
              )}

              <Divider borderColor={menuBorder} my={3} />

              {/* Boutiquier / Vendeur section */}
              <Box px={3} py={2}>
                <Text fontSize="sm" color={subtleTextColor} fontWeight="600">Boutiquier</Text>
              </Box>
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
                bg={brandColor}
                color="white"
                size="md"
                leftIcon={<span>🏪</span>}
                className="nav-vendre"
                _hover={{ bg: 'brand.700' }}
                justifyContent="flex-start"
              >
                Vendre
              </Button>
              {shop && (
                <Button 
                  as={RouterLink} 
                  to="/seller/shop" 
                  onClick={onClose} 
                  size="sm" 
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                >
                  Ma boutique
                </Button>
              )}
              {user?.role === 'admin' && (
                <Button 
                  as={RouterLink} 
                  to="/admin" 
                  onClick={onClose} 
                  size="sm" 
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                >
                  Admin
                </Button>
              )}
               <Box px={3} py={2}>
                <Text fontSize="sm" color={subtleTextColor} fontWeight="600">Pour tous</Text>
              </Box>

              {/* Mobile: quick upload reel button in sidebar/drawer */}
              {user ? (
                <Button
                  as={RouterLink}
                  to="/reels?upload=1"
                  onClick={onClose}
                  size="md"
                  variant="ghost"
                  leftIcon={<span>🎬</span>}
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                >
                  Poster un Reel
                </Button>
              ) : (
                <Button
                  onClick={() => { onClose(); navigate('/login') }}
                  size="md"
                  variant="ghost"
                  leftIcon={<span>🎬</span>}
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                >
                  Poster un Reel
                </Button>
              )}

               <Button 
                    size="md" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    onClick={() => { 
                      onClose(); 
                      signOut(); 
                      setUser(null); 
                      navigate('/login') 
                    }}
                    justifyContent="flex-start"
                  >
                    Se déconnecter
                  </Button>
                   <Button 
                    as={RouterLink} 
                    to="/login" 
                    onClick={onClose} 
                    size="md" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                  >
                    Connexion
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/signup" 
                    onClick={onClose} 
                    size="md" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                  >
                    S'inscrire
                  </Button>
            </VStack>
          </DrawerBody>
          {/* Recommendations modal mounted at navbar level so sidebar button can open it */}
          <Recommendations ref={recRef} hideTrigger />
          <DrawerFooter borderTopWidth="1px" borderColor={menuBorder}>
            <Text fontSize="sm" color={subtleTextColor}>Dalal ak jamm</Text>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}