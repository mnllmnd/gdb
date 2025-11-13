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

interface Category {
  id: number
  name: string
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
  
  // Couleurs style Nike/Zara
  const bgColor = useColorModeValue('white', 'black')
  const textColors = useColorModeValue('black', 'white')

  const textPrimary = useColorModeValue('#111111', 'white')
  const textSecondary = useColorModeValue('#666666', 'gray.400')
  const accentColor = useColorModeValue('#111111', 'white')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const subtleBg = useColorModeValue('#f8f8f8', 'gray.800')
  
  const cardHeight = useBreakpointValue({ base: '300px', md: '400px' })

  useEffect(() => {
    async function load() {
      try {
        if (!domain) return
        const s = await api.shops.byDomain(domain)
  setShop(s)
  // debug: log shop payload so we can confirm owner_phone presence
  try { console.debug('Shop payload:', s) } catch (e) {}

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

        try {
          const cats = await api.categories.list()
          setCategories(cats || [])
        } catch (err) {
          console.warn('Failed to load categories', err)
        }

        try {
          const reviews = await api.reviews.list({ shop_id: s.id, limit: 1 })
          setReviewCount(reviews?.aggregate?.count || 0)
        } catch (err) {
          console.warn('Failed to load review count', err)
        }
          // try to extract owner phone from shop row if present
          const possiblePhone = s?.phone ?? s?.owner_phone ?? s?.contact_phone ?? s?.whatsapp ?? null
          if (possiblePhone) setOwnerPhone(String(possiblePhone))
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

  // If ownerPhone not found on shop, try to fetch owner from admin users list (best-effort; will fail for non-admins)
  useEffect(() => {
    let cancelled = false
    async function fetchOwnerPhone() {
      if (ownerPhone) return
      if (!shop?.owner_id) return
      try {
        const users = await api.admin.users()
        if (cancelled) return
        if (Array.isArray(users)) {
          const owner = users.find((u: any) => String(u.id) === String(shop.owner_id))
          if (owner && (owner.phone || owner.phone_number)) {
            setOwnerPhone(owner.phone ?? owner.phone_number ?? null)
          }
        }
      } catch (e) {
        // ignore: likely not admin or endpoint not accessible
      }
    }
    fetchOwnerPhone()
    return () => { cancelled = true }
  }, [shop, ownerPhone])

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
                  {/** If shop has a phone number, show WhatsApp chat button */}
                  {(() => {
                    const phone = ownerPhone ?? shop?.phone ?? shop?.contact_phone ?? shop?.whatsapp ?? null
                    // debug: show resolved phone in console
                    try { console.debug('Resolved owner phone:', ownerPhone, shop?.owner_phone, shop?.phone) } catch (e) {}
                    if (!phone) return null
                    const normalized = normalizeSenegalPhone(String(phone))
                    if (!normalized) return null
                    const digits = normalized.replace(/^\+/, '')
                    const message = `Bonjour, je suis intéressé par vos produits sur ${shop?.name || 'votre boutique'}.`
                    const href = `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(message)}`
                    return (
                      <Button
                        as="a"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<Icon as={FaWhatsapp} />}
                        colorScheme="green"
                        variant="solid"
                        size="sm"
                      >
                        WhatsApp
                      </Button>
                    )
                  })()}
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

              {/* Stats compactes en une ligne */}
              <Flex 
                gap={{ base: 4, md: 8 }} 
                flexWrap="wrap"
                align="center"
                pt={3}
                borderTop="1px solid"
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