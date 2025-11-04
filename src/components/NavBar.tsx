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
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons'
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
  
 // Palette ultra-neutre comme Nike/Zara
  const navBg = 'white'
  const navBorder = 'gray.100'
  const textColor = 'black'
  const subtleTextColor = 'gray.500'
  const brandColor = 'black'
  const hoverBg = 'gray.50'
  const menuBg = 'white'
  const menuBorder = 'gray.100'
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

  const handleLogout = () => {
    signOut()
    setUser(null)
    navigate('/login')
    toast({
      title: "À bientôt",
      description: "Vous avez été déconnecté avec succès",
      status: "info",
      duration: 3000,
    })
  }

  // Icônes SVG pour un look plus épuré
  const HomeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )

  const ProductsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )

  const CartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )

  const ShopIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  )

  const UserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )

  const OrdersIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <path d="M1 10h22"/>
    </svg>
  )

  const LogoutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )

  return (
    <Box
      as="nav"
      bg={isScrolled ? navBg : 'transparent'}
      borderBottom={isScrolled ? '1px solid' : 'none'}
      borderColor={navBorder}
      boxShadow={isScrolled ? 'sm' : 'none'}
      px={4}
      py={2}
      position="sticky"
      top={0}
      zIndex={1400}
      backdropFilter="saturate(180%) blur(10px)"
      transition="all 0.3s ease"
    >
      <Flex align="center" maxW="1200px" mx="auto" justify="space-between">
        {/* Mobile: hamburger + panier */}
        {showMobileMenu ? (
          <HStack spacing={3} width="100%">
            <IconButton
              aria-label="Menu"
              icon={<HamburgerIcon />}
              onClick={onOpen}
              color={textColor}
              variant="ghost"
              _hover={{ bg: hoverBg }}
              size="sm"
            />
            <Spacer />
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher..."
              size="sm"
            />
            <Box position="relative">
              <IconButton
                as={RouterLink}
                to="/cart"
                aria-label="Panier"
                icon={<CartIcon />}
                variant="ghost"
                color={textColor}
                size="sm"
                _hover={{ bg: hoverBg }}
              />
              {cartCount > 0 && (
                <Box
                  position="absolute"
                  top={-1}
                  right={-1}
                  bg="red.500"
                  color="white"
                  px={1}
                  py={0.5}
                  borderRadius="full"
                  fontSize="2xs"
                  fontWeight="bold"
                  minW="16px"
                  h="16px"
                  textAlign="center"
                  lineHeight="1"
                  boxShadow="sm"
                  zIndex={1500}
                >
                  {cartCount}
                </Box>
              )}
            </Box>
          </HStack>
        ) : (
          // Desktop layout - Version compacte
          <>
            {/* Logo + Nom */}
            <HStack spacing={3} align="center" flexShrink={0}>
              <Avatar 
                size="sm" 
                name="Sama Bitik" 
                bg={brandColor} 
                color="white" 
                _hover={{ transform: 'scale(1.05)' }}
                transition="transform 0.2s ease"
              />
              <Heading size="md" color={textColor} fontWeight="700" letterSpacing="-0.5px" whiteSpace="nowrap">
                Sama Bitik
              </Heading>
            </HStack>

            <Spacer />

            {/* Navigation centrale - Version compacte */}
            <HStack spacing={6} align="center" mx={4} flexShrink={0}>
              <Button 
                as={RouterLink} 
                to="/" 
                variant="ghost" 
                size="sm" 
                leftIcon={<HomeIcon />}
                color={textColor}
                fontWeight="500"
                _hover={{ bg: hoverBg }}
                transition="all 0.2s ease"
              >
                Accueil
              </Button>
              <Button 
                as={RouterLink} 
                to="/products" 
                variant="ghost" 
                size="sm" 
                leftIcon={<ProductsIcon />}
                color={textColor}
                fontWeight="500"
                _hover={{ bg: hoverBg }}
                transition="all 0.2s ease"
              >
                Produits
              </Button>
              <Button 
                as={RouterLink}
                to="/feed"
                variant="ghost"
                size="sm"
                color={textColor}
                fontWeight="500"
                _hover={{ bg: hoverBg }}
                transition="all 0.2s ease"
              >
                Feed
              </Button>
            </HStack>

            <Spacer />

            {/* Actions droite - Version compacte */}
            <HStack spacing={4} align="center" flexShrink={0}>
              {/* Barre de recherche compacte */}
              <Box minW="200px" flexShrink={1}>
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Rechercher..."
                  size="sm"
                />
              </Box>

              {/* Bouton Vendre */}
              <Button
                variant="outline"
                size="sm"
                borderColor={brandColor}
                color={brandColor}
                onClick={() => {
                  if (user) navigate('/seller')
                  else toast({ 
                    title: 'Créez votre boutique', 
                    description: 'Rejoignez notre communauté de vendeurs', 
                    status: 'info',
                    duration: 5000,
                  })
                }}
                leftIcon={<ShopIcon />}
                _hover={{ 
                  bg: brandColor,
                  color: 'white',
                }}
                transition="all 0.2s ease"
                fontWeight="500"
                whiteSpace="nowrap"
              >
                Vendre
              </Button>

              {/* Panier */}
              <Box position="relative">
                <IconButton
                  as={RouterLink}
                  to="/cart"
                  aria-label="Panier"
                  icon={<CartIcon />}
                  variant="ghost"
                  color={textColor}
                  size="sm"
                  _hover={{ bg: hoverBg }}
                  transition="all 0.2s ease"
                />
                {cartCount > 0 && (
                  <Box
                    position="absolute"
                    top={-1}
                    right={-1}
                    bg="red.500"
                    color="white"
                    px={1}
                    py={0.5}
                    borderRadius="full"
                    fontSize="2xs"
                    fontWeight="bold"
                    minW="16px"
                    h="16px"
                    textAlign="center"
                    lineHeight="1"
                    boxShadow="sm"
                    zIndex={1500}
                  >
                    {cartCount}
                  </Box>
                )}
              </Box>

              {/* Menu utilisateur ou boutons connexion */}
              {user ? (
                <Menu placement="bottom-end">
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    _expanded={{ bg: hoverBg }}
                    px={2}
                    py={1}
                    borderRadius="md"
                    transition="all 0.2s ease"
                    size="sm"
                  >
                    <Avatar 
                      size="xs" 
                      name={user.display_name ?? user.phone} 
                      bg={brandColor}
                      color="white"
                      fontSize="2xs"
                    />
                  </MenuButton>
                  <Portal>
                    <MenuList 
                      bg={menuBg} 
                      borderColor={menuBorder}
                      boxShadow="xl"
                      borderRadius="lg"
                      py={2}
                      minW="180px"
                      zIndex={1600}
                    >
                      <MenuItem 
                        as={RouterLink} 
                        to="/profile" 
                        icon={<UserIcon />}
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        py={2}
                        fontSize="sm"
                      >
                        Mon profil
                      </MenuItem>
                      <MenuItem 
                        as={RouterLink} 
                        to="/orders" 
                        icon={<OrdersIcon />}
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        py={2}
                        fontSize="sm"
                      >
                        Mes commandes
                      </MenuItem>
                      {shop && (
                        <MenuItem 
                          as={RouterLink} 
                          to="/seller/shop" 
                          icon={<ShopIcon />}
                          color={textColor}
                          _hover={{ bg: hoverBg }}
                          py={2}
                          fontSize="sm"
                        >
                          Ma boutique
                        </MenuItem>
                      )}
                      <MenuDivider borderColor={menuBorder} />
                      <MenuItem 
                        onClick={handleLogout}
                        icon={<LogoutIcon />}
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        py={2}
                        fontSize="sm"
                      >
                        Se déconnecter
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              ) : (
                <HStack spacing={2}>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="ghost"
                    size="sm"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    transition="all 0.2s ease"
                    fontWeight="500"
                    whiteSpace="nowrap"
                  >
                    Connexion
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/signup"
                    variant="solid"
                    size="sm"
                    bg={brandColor}
                    color="white"
                    _hover={{ bg: 'gray.700' }}
                    transition="all 0.2s ease"
                    fontWeight="500"
                    whiteSpace="nowrap"
                  >
                    S'inscrire
                  </Button>
                </HStack>
              )}
            </HStack>
          </>
        )}
      </Flex>

      {/* Mobile drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={menuBg} zIndex={1700}>
          <DrawerHeader borderBottomWidth="1px" borderColor={menuBorder} py={4}>
            <HStack spacing={3}>
              <Avatar size="sm" name="Sama Bitik" bg={brandColor} color="white" />
              <Heading size="md" color={textColor} fontWeight="700">Sama Bitik</Heading>
            </HStack>
          </DrawerHeader>
          <DrawerBody py={4}>
            <VStack align="stretch" spacing={1}>
              {/* Navigation principale */}
              <Button 
                as={RouterLink} 
                to="/" 
                onClick={onClose} 
                variant="ghost" 
                size="md" 
                leftIcon={<HomeIcon />}
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
                py={3}
              >
                Accueil
              </Button>
              <Button 
                as={RouterLink} 
                to="/products" 
                onClick={onClose} 
                variant="ghost" 
                size="md" 
                leftIcon={<ProductsIcon />}
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
                py={3}
              >
                Produits
              </Button>
              <Button 
                as={RouterLink}
                to="/feed"
                onClick={onClose}
                variant="ghost"
                size="md"
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
                py={3}
              >
                Feed
              </Button>

              <Divider borderColor={menuBorder} my={3} />

              {/* Section utilisateur */}
              {user ? (
                <>
                  <Text fontSize="sm" color={subtleTextColor} px={3} py={2}>
                    Connecté en tant que <Text as="span" fontWeight="600">{user.display_name ?? user.phone}</Text>
                  </Text>
                  
                  <Button 
                    as={RouterLink} 
                    to="/profile" 
                    onClick={onClose} 
                    variant="ghost" 
                    size="md" 
                    leftIcon={<UserIcon />}
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                    py={3}
                  >
                    Mon profil
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/orders" 
                    onClick={onClose} 
                    variant="ghost" 
                    size="md" 
                    leftIcon={<OrdersIcon />}
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                    py={3}
                  >
                    Mes commandes
                  </Button>
                  
                  <Button 
                    size="md" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    onClick={() => { 
                      onClose()
                      handleLogout()
                    }}
                    justifyContent="flex-start"
                    leftIcon={<LogoutIcon />}
                    py={3}
                  >
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    as={RouterLink} 
                    to="/login" 
                    onClick={onClose} 
                    size="md" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                    py={3}
                  >
                    Connexion
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/signup" 
                    onClick={onClose} 
                    size="md" 
                    variant="solid"
                    bg={brandColor}
                    color="white"
                    _hover={{ bg: 'gray.700' }}
                    justifyContent="flex-start"
                    py={3}
                  >
                    S'inscrire
                  </Button>
                </>
              )}

              <Divider borderColor={menuBorder} my={3} />

              {/* Section vendeur */}
              <Text fontSize="sm" color={subtleTextColor} fontWeight="600" px={3} py={2}>
                Devenir vendeur
              </Text>
              <Button
                onClick={() => {
                  onClose()
                  if (user) navigate('/seller')
                  else toast({ 
                    title: 'Créez votre boutique', 
                    description: 'Rejoignez notre communauté de vendeurs',
                    status: 'info',
                    duration: 5000
                  })
                }}
                variant="outline"
                borderColor={brandColor}
                color={brandColor}
                size="md"
                leftIcon={<ShopIcon />}
                _hover={{ bg: brandColor, color: 'white' }}
                justifyContent="flex-start"
                py={3}
              >
                Vendre
              </Button>
              {shop && (
                <Button 
                  as={RouterLink} 
                  to="/seller/shop" 
                  onClick={onClose} 
                  size="md" 
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  justifyContent="flex-start"
                  py={3}
                >
                  Ma boutique
                </Button>
              )}
            </VStack>
          </DrawerBody>
          <Recommendations ref={recRef} hideTrigger />
          <DrawerFooter borderTopWidth="1px" borderColor={menuBorder} py={4}>
            <Text fontSize="sm" color={subtleTextColor}>Dalal ak jamm</Text>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}