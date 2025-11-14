import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import {
  Container,
  Heading,
  Text,
  Spinner,
  Box,
  useBreakpointValue,
  Grid,
  GridItem,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  HStack,
  Collapse,
  Button,
  Icon,
  Image,
  Divider,
  useColorModeValue,
  Flex,
  SimpleGrid,
  AspectRatio,
  Tooltip,
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from 'react-icons/fa'
import api from '../services/api'
import FollowButton from '../components/FollowButton'
import { FaWhatsapp } from 'react-icons/fa'
import { normalizeSenegalPhone } from '../utils/phone'
import ProductCard from '../components/ProductCard'
import BackButton from '../components/BackButton'
import ReviewForm from '../components/ReviewForm'
import ReviewsList from '../components/ReviewsList'
import { getCurrentUser } from '../services/auth'

interface Category {
  id: number
  name: string
}

interface User {
  id: string
  phone: string
  display_name: string
  email: string
  role: string
}

export default function ShopView() {
  const { domain } = useParams()
  const location = useLocation()
  const [shop, setShop] = useState<Record<string, any> | null>(null)
  const [products, setProducts] = useState<any[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categorizedProducts, setCategorizedProducts] = useState<Record<number, any[]>>({})
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [ownerData, setOwnerData] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  
  // Couleurs style Nike/Zara
  const bgColor = useColorModeValue('white', 'black')
  const textColors = useColorModeValue('black', 'white')

  const textPrimary = useColorModeValue('#111111', 'white')
  const textSecondary = useColorModeValue('#666666', 'gray.400')
  const accentColor = useColorModeValue('#111111', 'white')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const subtleBg = useColorModeValue('#f8f8f8', 'gray.800')
  
  const cardHeight = useBreakpointValue({ base: '300px', md: '400px' })

  // Fonction pour récupérer tous les utilisateurs (admin seulement)
  const fetchAllUsers = async () => {
    try {
      console.debug('Fetching all users via admin API')
      const users = await api.admin.users()
      if (Array.isArray(users)) {
        setAllUsers(users)
        console.debug('All users loaded:', users.length)
        return users
      }
    } catch (error) {
      console.debug('Admin API not available or access denied:', error)
      return []
    }
    return []
  }

  // Fonction pour récupérer les données du propriétaire
  const fetchOwnerData = async (ownerId: string) => {
    try {
      console.debug('Fetching owner data for ID:', ownerId)
      
      // Essayer d'abord avec les utilisateurs déjà chargés
      if (allUsers.length > 0) {
        const owner = allUsers.find((u: any) => String(u.id) === String(ownerId))
        if (owner) {
          console.debug('Owner found in preloaded users:', owner)
          setOwnerData(owner)
          if (owner.phone) {
            setOwnerPhone(owner.phone)
          }
          return
        }
      }

      // Sinon, essayer de charger les utilisateurs via admin API
      try {
        const users = await api.admin.users()
        if (Array.isArray(users)) {
          const owner = users.find((u: any) => String(u.id) === String(ownerId))
          if (owner) {
            console.debug('Owner found via admin API:', owner)
            setOwnerData(owner)
            if (owner.phone) {
              setOwnerPhone(owner.phone)
            }
            return
          }
        }
      } catch (adminError) {
        console.debug('Admin API not available, trying current user')
      }

      // Dernier recours: vérifier si l'utilisateur connecté est le propriétaire
      try {
        const currentUser = getCurrentUser()
        if (currentUser && currentUser.id === ownerId && currentUser.phone) {
          console.debug('Using current user as owner:', currentUser)
          setOwnerData(currentUser)
          setOwnerPhone(currentUser.phone)
          return
        }
      } catch (currentUserError) {
        console.debug('Could not get current user')
      }

      console.debug('No owner data found for ID:', ownerId)
    } catch (error) {
      console.error('Error fetching owner data:', error)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        if (!domain) return
        
        // Charger d'abord tous les utilisateurs (en parallèle si possible)
        const usersPromise = fetchAllUsers()
        
        const s = await api.shops.byDomain(domain)
        setShop(s)
        
        console.debug('Shop loaded:', s)
        
        // Attendre que les utilisateurs soient chargés puis récupérer le propriétaire
        const users = await usersPromise
        if (s.owner_id) {
          // Si les utilisateurs sont déjà chargés, chercher directement
          if (users.length > 0) {
            const owner = users.find((u: any) => String(u.id) === String(s.owner_id))
            if (owner) {
              setOwnerData(owner)
              if (owner.phone) setOwnerPhone(owner.phone)
            }
          } else {
            // Fallback
            await fetchOwnerData(s.owner_id)
          }
        }
        
        // Récupérer le statut follow
        try {
          const followStatus = await api.shops.followStatus(String(s.id))
          if (followStatus && typeof followStatus.count === 'number') {
            setShop((prev) => ({ ...(prev || {}), followers_count: followStatus.count }))
          }
        } catch (e) {
          console.warn('Failed to fetch follow status for shop view', e)
        }

        // Charger les produits
        let found: any[] = []
        try {
          const all = await api.products.list()
          found = Array.isArray(all)
            ? all.filter(
                (p: any) =>
                  String(p.seller_id) === String(s.owner_id) || String(p.shop_id) === String(s.id)
              )
            : []
        } catch (error_) {
          console.warn('Failed to load shop-specific products', error_)
          found = []
        }

        setProducts(found)

        // Charger les catégories
        try {
          const cats = await api.categories.list()
          setCategories(cats || [])
        } catch (err) {
          console.warn('Failed to load categories', err)
        }

        // Charger le nombre d'avis
        try {
          const reviews = await api.reviews.list({ shop_id: s.id, limit: 1 })
          setReviewCount(reviews?.aggregate?.count || 0)
        } catch (err) {
          console.warn('Failed to load review count', err)
        }

      } catch (err) {
        console.error(err)
        setShop(null)
        setProducts([])
      }
    }
    load()
  }, [domain])

  useEffect(() => {
    const map: Record<number, any[]> = {}
    const list = products || []
    for (const p of list) {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    }
    setCategorizedProducts(map)
  }, [products])

  // Navigation vers un produit spécifique
  useEffect(() => {
    try {
      const state = (location && (location.state as any)) || {}
      const focusId = state.focusProductId || (state.from && state.from.focusProductId) || null
      if (!focusId) return
      let attempts = 0
      const maxAttempts = 10
      const tryJump = () => {
        attempts += 1
        const el = document.getElementById(`product-${String(focusId)}`)
        if (el) {
            try {
            el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
            try { el.setAttribute('tabindex', '-1'); (el as HTMLElement).focus() } catch (e) {}
            try { el.animate([{ boxShadow: '0 0 0px rgba(0,0,0,0)' }, { boxShadow: '0 0 14px rgba(0,150,136,0.28)' }, { boxShadow: '0 0 0px rgba(0,0,0,0)' }], { duration: 900 }) } catch (e) {}
          } catch (e) {}
        } else if (attempts < maxAttempts) {
          setTimeout(tryJump, 60)
        }
      }
      tryJump()
    } catch (e) {
      // ignore
    }
  }, [location, products])

  // Fonction pour obtenir le numéro WhatsApp normalisé
  const getWhatsAppNumber = () => {
    const phone = ownerPhone
    console.debug('Resolved phone for WhatsApp:', { ownerPhone, ownerData })
    
    if (!phone) return null
    
    const normalized = normalizeSenegalPhone(String(phone))
    console.debug('Normalized phone:', normalized)
    
    return normalized
  }

  // Gestion du clic sur le bouton WhatsApp
  const handleWhatsAppClick = () => {
    const whatsappNumber = getWhatsAppNumber()
    
    if (whatsappNumber) {
      // Numéro disponible - ouvrir WhatsApp
      const digits = whatsappNumber.replace(/^\+/, '')
      const message = `Bonjour${ownerData?.display_name ? ` ${ownerData.display_name}` : ''}, je suis intéressé par vos produits sur ${shop?.name || 'votre boutique'}.`
      const href = `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(message)}`
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      // Numéro non disponible - demander à l'utilisateur d'entrer le numéro
      const userPhone = prompt(
        `Le vendeur ${shop?.name || ''} n'a pas configuré son numéro WhatsApp.\n\nVeuillez entrer le numéro du vendeur (format: +221 XX XXX XX XX) :`,
        '+221'
      )
      
      if (userPhone && userPhone.trim()) {
        setWhatsappLoading(true)
        try {
          const normalizedUserPhone = normalizeSenegalPhone(userPhone.trim())
          if (normalizedUserPhone) {
            const digits = normalizedUserPhone.replace(/^\+/, '')
            const message = `Bonjour, je suis intéressé par vos produits sur ${shop?.name || 'votre boutique'}.`
            const href = `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(message)}`
            window.open(href, '_blank', 'noopener,noreferrer')
          } else {
            alert('Numéro invalide. Veuillez utiliser le format: +221 XX XXX XX XX')
          }
        } catch (error) {
          alert('Erreur lors de l\'ouverture de WhatsApp. Veuillez réessayer.')
        } finally {
          setWhatsappLoading(false)
        }
      }
    }
  }

  if (!domain) return <Container py={8}>Nom de boutique manquant</Container>

  return (
    <Box w="100vw" overflowX="hidden" bg={bgColor}>
      {/* 🏞️ Hero Banner Minimaliste */}
      {shop?.banner_url && (
        <Box
          position="relative"
          w="100%"
          h={{ base: '200px', md: '350px' }}
          mb={-8}
          overflow="hidden"
        >
          <Image
            src={shop.banner_url}
            alt={shop.name}
            w="100%"
            h="100%"
            objectFit="cover"
            filter="brightness(0.85)"
          />
        </Box>
      )}

      <Container maxW="container.xl" py={{ base: 8, md: 16 }} px={{ base: 4, md: 6 }}>
        <BackButton to={location.state?.from} />

        {shop === null ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" color={accentColor} thickness="3px" />
          </Flex>
        ) : (
          <>
            {/* 🧾 Description Boutique - Style compact */}
            <Box
              mb={8}
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor={borderColor}
              bg={bgColor}
            >
              {/* En-tête avec nom et bouton follow */}
              <Flex justify="space-between" align="center" mb={4}>
                <Heading 
                  size={{ base: 'md', md: 'lg' }}
                  color={textPrimary}
                  fontWeight="700"
                  letterSpacing="-0.5px"
                  textTransform="uppercase"
                >
                  {shop.name}
                </Heading>
                <HStack spacing={3}>
                  <FollowButton id={String(shop.id)} />
                  
                  {/* Bouton WhatsApp - Toujours affiché */}
                  <Tooltip
                    label={
                      getWhatsAppNumber() 
                        ? `Contacter ${ownerData?.display_name || 'le vendeur'} sur WhatsApp` 
                        : "Le vendeur n'a pas configuré son numéro. Cliquez pour entrer un numéro manuellement."
                    }
                    placement="top"
                    hasArrow
                  >
                    <Button
                      onClick={handleWhatsAppClick}
                      leftIcon={<Icon as={FaWhatsapp} />}
                      colorScheme="green"
                      variant="solid"
                      size="sm"
                      bg="green.500"
                      _hover={{ bg: 'green.600' }}
                      isLoading={whatsappLoading}
                      loadingText="Ouverture..."
                    >
                      WhatsApp
                    </Button>
                  </Tooltip>
                </HStack>
              </Flex>

              {/* Description */}
              {shop.description && (
                <Text
                  color={textSecondary}
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="400"
                  mb={4}
                  lineHeight="1.5"
                  noOfLines={2}
                >
                  {shop.description}
                </Text>
              )}

              {/* Informations du propriétaire (nom seulement) */}
              {ownerData && (
                <Flex 
                  gap={4} 
                  flexWrap="wrap"
                  align="center"
                  pt={3}
                  borderTop="1px solid"
                  borderColor={borderColor}
                >
                  <Text fontSize="sm" color={textSecondary}>
                    Vendeur: <Text as="span" fontWeight="600" color={textPrimary}>{ownerData.display_name}</Text>
                  </Text>
                </Flex>
              )}

              {/* Stats compactes en une ligne */}
              <Flex 
                gap={{ base: 4, md: 8 }} 
                flexWrap="wrap"
                align="center"
                pt={3}
                borderTop={ownerData ? "1px solid" : "none"}
                borderColor={borderColor}
              >
                <HStack spacing={2}>
                  <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="800" color={accentColor}>
                    {products?.length || 0}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color={textSecondary} fontWeight="600">
                    Produits
                  </Text>
                </HStack>
                
                <HStack spacing={2}>
                  <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="800" color={accentColor}>
                    {reviewCount}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color={textSecondary} fontWeight="600">
                    Avis
                  </Text>
                </HStack>
                
                <HStack spacing={2}>
                  <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="800" color={accentColor}>
                    {shop.followers_count || 0}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color={textSecondary} fontWeight="600">
                    Abonnés
                  </Text>
                </HStack>
                
                <HStack spacing={1}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon 
                      key={star} 
                      as={star <= 4 ? FaStar : FaRegStar}
                      color={star <= 4 ? "yellow.400" : "gray.300"}
                      boxSize={{ base: 3, md: 4 }}
                    />
                  ))}
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color={textSecondary} fontWeight="600" ml={1}>
                    (4.0)
                  </Text>
                </HStack>
              </Flex>
            </Box>

            {/* ⭐ Avis Clients - Style compact */}
            <Box
              mb={8}
              border="1px solid"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Button
                w="50%"
                justifyContent="center"
                onClick={() => setReviewsOpen(!reviewsOpen)}
                bg={bgColor}
                _hover={{ bg: subtleBg }}
                py={{ base: 4, md: 5 }}
                px={{ base: 4, md: 6 }}
                rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} boxSize={5} />}
                borderRadius="none"
              >
                <HStack spacing={3}>
                  <Text fontSize={{ base: 'md', md: 'md' }} fontWeight="300" color={textPrimary} textTransform="uppercase">
                    Avis Clients
                  </Text>
                  {reviewCount > 0 && (
                    <Badge 
                      color={textColors}
                      fontSize={{ base: 'sm', md: 'sm' }}
                      px={{ base: 1, md: 2 }}
                      py={1}
                      borderRadius="none"
                      fontWeight="300"
                    >
                      {reviewCount}
                    </Badge>
                  )}
                </HStack>
              </Button>

              <Collapse in={reviewsOpen} animateOpacity>
                <Box p={{ base: 4, md: 6 }} bg={subtleBg}>
                  <Tabs variant="unstyled">
                    <TabList mb={4} borderBottom="1px solid" borderColor={borderColor}>
                      <Tab 
                        fontWeight="300" 
                        color={textSecondary}
                        _selected={{ 
                          color: textPrimary, 
                          borderBottom: "2px solid",
                          borderColor: accentColor
                        }}
                        py={2}
                        px={{ base: 3, md: 5 }}
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Voir les avis
                      </Tab>
                      <Tab 
                        fontWeight="600" 
                        color={textSecondary}
                        _selected={{ 
                          color: textPrimary, 
                          borderBottom: "2px solid",
                          borderColor: accentColor
                        }}
                        py={2}
                        px={{ base: 3, md: 5 }}
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Laisser un avis
                      </Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel px={0}>
                        <Box
                          maxH="400px"
                          overflowY="auto"
                          css={{
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-thumb': {
                              background: borderColor,
                              borderRadius: '0px',
                            },
                          }}
                        >
                          <ReviewsList shopId={String(shop.id)} />
                        </Box>
                      </TabPanel>
                      <TabPanel px={0}>
                        <ReviewForm
                          shopId={String(shop.id)}
                          onSuccess={() => setReviewCount((prev) => prev + 1)}
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </Collapse>
            </Box>

            {/* 🛒 Produits - Grille améliorée */}
            <Box>
              {products === null && (
                <Flex justify="center" py={20}>
                  <Spinner size="xl" color={accentColor} thickness="3px" />
                </Flex>
              )}
              
              {products !== null && products.length === 0 && (
                <Box textAlign="center" py={16}>
                  <Icon as={FaRegHeart} boxSize={16} color={textSecondary} mb={4} />
                  <Text fontSize="xl" color={textSecondary} fontWeight="600">
                    Aucun produit disponible pour le moment.
                  </Text>
                </Box>
              )}

              {products && products.length > 0 && (
                <VStack spacing={{ base: 8, md: 12 }} align="stretch">
                  {/* Produits sans catégorie */}
                  {(() => {
                    const uncategorized = (products || []).filter((p) => !p.category_id)
                    if (uncategorized.length === 0) return null
                    return (
                      <Box>
                        <Heading
                          size={{ base: 'sm', md: 'md' }}
                          mb={{ base: 4, md: 6 }}
                          color={textPrimary}
                          fontWeight="700"
                          letterSpacing="tight"
                          textTransform="uppercase"
                          borderLeft="4px solid"
                          borderColor={accentColor}
                          pl={3}
                        >
                          Découvertes
                        </Heading>
                        <Grid
                          templateColumns={{
                            base: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)',
                            xl: 'repeat(5, 1fr)',
                          }}
                          gap={{ base: 4, md: 6 }}
                          w="100%"
                        >
                          {uncategorized.map((product) => (
                            <GridItem key={product.id} minW="0">
                              <ProductCard
                                id={String(product.id)}
                                title={product.title || product.name || ''}
                                description={product.description || product.details || ''}
                                price={product.price ?? product.amount}
                                originalPrice={product.original_price ?? product.originalPrice}
                                discount={product.discount ?? 0}
                                image_url={product.image_url ?? product.product_image}
                                images={product.images}
                                quantity={
                                  product.quantity ??
                                  product.quantite ??
                                  product.stock ??
                                  product.amount_available
                                }
                                shopName={shop.name}
                                shopDomain={shop.domain}
                                height={cardHeight}
                              />
                            </GridItem>
                          ))}
                        </Grid>
                      </Box>
                    )
                  })()}

                  {/* Produits par catégorie */}
                  {categories
                    .filter((category) => (categorizedProducts[category.id] || []).length > 0)
                    .map((category) => (
                      <Box key={category.id}>
                        <Heading
                          size={{ base: 'sm', md: 'md' }}
                          mb={{ base: 4, md: 6 }}
                          color={textPrimary}
                          fontWeight="700"
                          letterSpacing="tight"
                          textTransform="uppercase"
                          borderLeft="4px solid"
                          borderColor={accentColor}
                          pl={3}
                        >
                          {category.name}
                        </Heading>
                        <Grid
                          templateColumns={{
                            base: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)',
                            xl: 'repeat(5, 1fr)',
                          }}
                          gap={{ base: 4, md: 6 }}
                          w="100%"
                        >
                          {(categorizedProducts[category.id] || []).map((product) => (
                            <GridItem key={product.id} minW="0">
                              <ProductCard
                                id={String(product.id)}
                                title={product.title || product.name || ''}
                                description={product.description || product.details || ''}
                                price={product.price ?? product.amount}
                                originalPrice={product.original_price ?? product.originalPrice}
                                discount={product.discount ?? 0}
                                image_url={product.image_url ?? product.product_image}
                                images={product.images}
                                quantity={
                                  product.quantity ??
                                  product.quantite ??
                                  product.stock ??
                                  product.amount_available
                                }
                                shopName={shop.name}
                                shopDomain={shop.domain}
                                height={cardHeight}
                              />
                            </GridItem>
                          ))}
                        </Grid>
                      </Box>
                    ))}
                </VStack>
              )}
            </Box>
          </>
        )}
      </Container>
    </Box>
  )
}