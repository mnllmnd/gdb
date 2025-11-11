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
  useColorMode,
  Portal,
  Icon,
} from '@chakra-ui/react'
import { ChevronDownIcon, HamburgerIcon, SunIcon, MoonIcon } from '@chakra-ui/icons'
import { FaHeart } from 'react-icons/fa'
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
  const [user, setUser] = useState<User | null>(() => {
    const currentUser = getCurrentUser() as User | null;
    console.log('Current user:', currentUser);
    return currentUser;
  })
  const [shop, setShop] = useState<Shop | null>(null)
  const [cartCount, setCartCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Palette sobre style Zara
  const navBg = useColorModeValue('white', 'black')
  const navBorder = useColorModeValue('gray.200', 'gray.800')
  const textColor = useColorModeValue('black', 'white')
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400')
  const brandColor = useColorModeValue('black', 'white')
  const hoverBg = useColorModeValue('gray.50', 'gray.800')
  const menuBg = useColorModeValue('white', 'black')
  const menuBorder = useColorModeValue('gray.200', 'gray.800')
  const { colorMode, toggleColorMode } = useColorMode()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    ;(globalThis as any).handleGlobalSearch?.(query)
  }
  
  const navigate = useNavigate()
  const toast = useToast()
  const showMobileMenu = useBreakpointValue({ base: true, md: false })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const recRef = React.useRef<any>(null)

  // Helper to detect admin role in different possible shapes
  const isAdmin = (u: User | null | undefined) => {
    if (!u) return false
    const r: any = (u as any).role
    if (!r) return false
    if (Array.isArray(r)) return r.map(String).some(s => s.toLowerCase() === 'admin')
    if (typeof r === 'string') return r.toLowerCase() === 'admin'
    return false
  }

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

  // Icônes SVG épurées
  const HomeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )

  const ProductsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )

  const CartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )

  const ShopIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  )

  const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )

  const OrdersIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <path d="M1 10h22"/>
    </svg>
  )

const LogoutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )

  const AdminIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4L4 8l8 4 8-4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  )

  return (
    <Box
      as="nav"
      bg={navBg}
      borderBottom="1px solid"
      borderColor={navBorder}
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={1400}
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
                to="/wishlist"
                aria-label="Wishlist"
                icon={<Icon as={FaHeart} />}
                variant="ghost"
                color={textColor}
                size="sm"
                _hover={{ bg: hoverBg }}
              />
            </Box>
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
            <IconButton
              aria-label={colorMode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              variant="ghost"
              size="sm"
              onClick={toggleColorMode}
              _hover={{ bg: hoverBg }}
              color={textColor}
            />
          </HStack>
        ) : (
          // Desktop layout - Style Zara épuré
          <>
            {/* Logo + Nom */}
            <HStack spacing={3} align="center" flexShrink={0}>
              <Avatar 
                size="sm" 
                name="Sama Bitik" 
                color={textColor} 
                borderRadius="none"
              />
              <Heading 
                size="md" 
                color={textColor} 
                fontWeight="normal" 
                letterSpacing="wide"
                fontSize="lg"
              >
                SAMA BITIK
              </Heading>
            </HStack>

            <Spacer />

            {/* Navigation centrale - Style minimaliste */}
            <HStack spacing={8} align="center" mx={4} flexShrink={0}>
              <Button 
                as={RouterLink} 
                to="/" 
                variant="ghost" 
                size="sm" 
                color={textColor}
                fontWeight="normal"
                _hover={{ bg: hoverBg }}
                borderRadius="none"
                fontSize="sm"
                letterSpacing="wide"
              >
                ACCUEIL
              </Button>
              <Button 
                as={RouterLink} 
                to="/products" 
                variant="ghost" 
                size="sm" 
                color={textColor}
                fontWeight="normal"
                _hover={{ bg: hoverBg }}
                borderRadius="none"
                fontSize="sm"
                letterSpacing="wide"
              >
                PRODUITS
              </Button>
              <Button 
                as={RouterLink}
                to="/feed"
                variant="ghost"
                size="sm"
                color={textColor}
                fontWeight="normal"
                _hover={{ bg: hoverBg }}
                borderRadius="none"
                fontSize="sm"
                letterSpacing="wide"
              >
                FEED
              </Button>
            </HStack>

            <Spacer />

            {/* Actions droite - Style épuré */}
            <HStack spacing={4} align="center" flexShrink={0}>
              {/* Theme toggle */}
              <IconButton
                aria-label={colorMode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
                _hover={{ bg: hoverBg }}
                color={textColor}
              />

              {/* Barre de recherche */}
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
                as={RouterLink}
                to="/seller"
                variant="outline"
                size="sm"
                borderColor={brandColor}
                color={brandColor}
                leftIcon={<ShopIcon />}
                transition="all 0.2s ease"
                fontWeight="500"
                whiteSpace="nowrap"
              >
                Vendre
              </Button>

              {/* Wishlist */}
              <Box position="relative">
                <IconButton
                  as={RouterLink}
                  to="/wishlist"
                  aria-label="Wishlist"
                  icon={<Icon as={FaHeart} />}
                  variant="ghost"
                  color={textColor}
                  size="sm"
                  _hover={{ bg: hoverBg }}
                />
              </Box>

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
                  borderRadius="none"
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
                    borderRadius="none"
                    transition="all 0.2s ease"
                    size="sm"
                  >
                    <Avatar 
                      size="xs" 
                      name={user.display_name ?? user.phone} 
                      color="navBg"
                      fontSize="2xs"
                      borderRadius="none"
                    />
                  </MenuButton>
                  <Portal>
                    <MenuList 
                      bg={navBg} 
                      borderColor={menuBorder}
                      borderRadius="none"
                      py={2}
                      minW="180px"
                      zIndex={1600}
                      borderWidth="1px"
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
                        MON PROFIL
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
                        MES COMMANDES
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
                          MA BOUTIQUE
                        </MenuItem>
                      )}
                      {isAdmin(user) && (
                        <>
                          <MenuDivider borderColor={menuBorder} />
                          <MenuItem 
                            as={RouterLink} 
                            to="/admin" 
                            icon={<AdminIcon />}
                            color="red.500"
                            _hover={{ bg: hoverBg }}
                            py={2}
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            ADMIN
                          </MenuItem>
                        </>
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
                        SE DÉCONNECTER
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
                    fontWeight="normal"
                    borderRadius="none"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    CONNEXION
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/signup"
                    variant="solid"
                    size="sm"
                    
                    _hover={{ bg: 'gray.700' }}
                    transition="all 0.2s ease"
                    fontWeight="normal"
                    borderRadius="none"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    S'INSCRIRE
                  </Button>
                </HStack>
              )}
            </HStack>
          </>
        )}
      </Flex>

      {/* Mobile drawer - Style Zara */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={menuBg} zIndex={1700} borderRadius="none">
          <DrawerHeader borderBottomWidth="1px" borderColor={menuBorder} py={4}>
            <HStack spacing={3}>
              <Avatar size="sm" name="Sama Bitik" color={textColor} borderRadius="none" />
              <Heading 
                size="md" 
                color={textColor} 
                fontWeight="normal" 
                letterSpacing="wide"
                fontSize="lg"
              >
                SAMA BITIK
              </Heading>
            </HStack>
          </DrawerHeader>
          <DrawerBody py={4}>
            <VStack align="stretch" spacing={0}>
              {/* Navigation principale */}
              <Button 
                as={RouterLink} 
                to="/" 
                onClick={onClose} 
                variant="ghost" 
                size="sm" 
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
                py={3}
                borderRadius="none"
                fontWeight="normal"
                fontSize="sm"
                letterSpacing="wide"
              >
                ACCUEIL
              </Button>
              <Button 
                as={RouterLink} 
                to="/products" 
                onClick={onClose} 
                variant="ghost" 
                size="sm" 
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
                py={3}
                borderRadius="none"
                fontWeight="normal"
                fontSize="sm"
                letterSpacing="wide"
              >
                PRODUITS
              </Button>
              <Button 
                as={RouterLink}
                to="/feed"
                onClick={onClose}
                variant="ghost"
                size="sm"
                color={textColor}
                _hover={{ bg: hoverBg }}
                justifyContent="flex-start"
                py={3}
                borderRadius="none"
                fontWeight="normal"
                fontSize="sm"
                letterSpacing="wide"
              >
                FEED
              </Button>

              <Divider borderColor={menuBorder} my={2} />

              {/* Section utilisateur */}
              {user ? (
                <>
                  <Text fontSize="xs" color={subtleTextColor} px={3} py={2} letterSpacing="wide">
                    Connecté en tant que <Text as="span" fontWeight="normal" color={textColor}>{user.display_name ?? user.phone}</Text>
                  </Text>
                  
                  <Button 
                    as={RouterLink} 
                    to="/profile" 
                    onClick={onClose} 
                    variant="ghost" 
                    size="sm" 
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                    py={3}
                    borderRadius="none"
                    fontWeight="normal"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    MON PROFIL
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/orders" 
                    onClick={onClose} 
                    variant="ghost" 
                    size="sm" 
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                    py={3}
                    borderRadius="none"
                    fontWeight="normal"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    MES COMMANDES
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    onClick={() => { 
                      onClose()
                      handleLogout()
                    }}
                    justifyContent="flex-start"
                    py={3}
                    borderRadius="none"
                    fontWeight="normal"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    SE DÉCONNECTER
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    as={RouterLink} 
                    to="/login" 
                    onClick={onClose} 
                    size="sm" 
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                    justifyContent="flex-start"
                    py={3}
                    borderRadius="none"
                    fontWeight="normal"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    CONNEXION
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/signup" 
                    onClick={onClose} 
                    size="sm" 
                    variant="solid"
                   
                    _hover={{ bg: 'gray.700' }}
                    justifyContent="flex-start"
                    py={3}
                    borderRadius="none"
                    fontWeight="normal"
                    fontSize="sm"
                    letterSpacing="wide"
                  >
                    S'INSCRIRE
                  </Button>
                </>
              )}

              <Divider borderColor={menuBorder} my={2} />

              {/* Section vendeur */}
              <Text fontSize="xs" color={subtleTextColor} fontWeight="normal" px={3} py={2} letterSpacing="wide">
                DEVENIR VENDEUR
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
                size="sm"
                leftIcon={<ShopIcon />}
                _hover={{ bg: brandColor, color: 'white' }}
                justifyContent="flex-start"
                py={3}
                borderRadius="none"
                fontWeight="500"
                whiteSpace="nowrap"
                fontSize="sm"
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
                  py={3}
                  borderRadius="none"
                  fontWeight="normal"
                  fontSize="sm"
                  letterSpacing="wide"
                >
                  MA BOUTIQUE
                </Button>
              )}
              {isAdmin(user) && (
                <>
                  <Divider borderColor={menuBorder} my={2} />
                  <Button 
                    as={RouterLink} 
                    to="/admin" 
                    onClick={onClose} 
                    size="sm" 
                    variant="solid"
                    bg="red.500"
                    color="white"
                    _hover={{ bg: 'red.600' }}
                    justifyContent="flex-start"
                    py={3}
                    borderRadius="none"
                    fontWeight="bold"
                    fontSize="sm"
                    letterSpacing="wide"
                    leftIcon={<AdminIcon />}
                  >
                    ADMIN
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
          <Recommendations ref={recRef} hideTrigger />
          <DrawerFooter borderTopWidth="1px" borderColor={menuBorder} py={4}>
            <Text fontSize="xs" color={subtleTextColor} letterSpacing="wide">DALAL AK JAMM</Text>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}