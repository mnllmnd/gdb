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
  
  // Couleurs style Nike/Zara
  const bgColor = useColorModeValue('white', 'black')
  const textPrimary = useColorModeValue('#111111', 'white')
  const textSecondary = useColorModeValue('#666666', 'gray.400')
  const accentColor = useColorModeValue('#111111', 'white')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const subtleBg = useColorModeValue('#f8f8f8', 'gray.800')
  
  const cardHeight = useBreakpointValue({ base: '300px', md: '400px' }) // Cartes plus volumineuses

  useEffect(() => {
    async function load() {
      try {
        if (!domain) return
        const s = await api.shops.byDomain(domain)
        setShop(s)

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

  if (!domain) return <Container py={8}>Nom de boutique manquant</Container>

  return (
    <Box w="100vw" overflowX="hidden" bg={bgColor}>
      {/* 🏞️ Hero section style Nike */}
      {shop?.banner_url ? (
        <Box
          position="relative"
          w="100%"
          h={{ base: '300px', md: '500px' }} // Hauteur augmentée
          mb={-8}
          overflow="hidden"
        >
          <Image
            src={shop.banner_url}
            alt={shop.name}
            w="100%"
            h="100%"
            objectFit="cover"
            filter="brightness(0.8)" // Image plus claire
          />
          <Box
            position="absolute"
            inset="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDir="column"
            textAlign="center"
            px={4}
            bg="linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))"
          >
            <Heading
              color={bgColor}
              fontSize={{ base: '3xl', md: '6xl' }} // Typographie plus grande
              fontWeight="900" // Font weight plus fort style Nike
              letterSpacing="tight"
              textTransform="uppercase" // Style Zara
              textShadow="0px 4px 12px rgba(0,0,0,0.8)"
              lineHeight="1.1"
            >
              {shop.name || shop.domain}
            </Heading>
            <Text
              color={bgColor}
              mt={4}
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="500"
              letterSpacing="wide"
              textShadow="0px 2px 8px rgba(0,0,0,0.6)"
            >
              Découvrez notre collection exclusive
            </Text>
          </Box>
        </Box>
      ) : (
        // Fallback si pas de bannière
        <Box
          position="relative"
          w="100%"
          h={{ base: '200px', md: '300px' }}
          bg={accentColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb={-8}
        >
          <Heading
            color="white"
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="900"
            letterSpacing="tight"
            textTransform="uppercase"
          >
            {shop?.name || shop?.domain}
          </Heading>
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
            {/* 🧾 Description Boutique - Style épuré */}
            <Box
              mb={12}
              p={{ base: 6, md: 10 }}
              border="1px solid"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Flex justify="space-between" align="start" mb={6}>
                <VStack align="start" spacing={3} flex="1">
                  <Heading 
                    size="xl" 
                    color={textPrimary}
                    fontWeight="700"
                    letterSpacing="-0.5px"
                    textTransform="uppercase"
                  >
                    {shop.name}
                  </Heading>
                  <Text
                    color={textSecondary}
                    fontSize="lg"
                    fontWeight="500"
                    maxW="600px"
                    lineHeight="1.6"
                  >
                    {shop.description || "Cette boutique n'a pas encore ajouté de description."}
                  </Text>
                </VStack>
                <FollowButton id={String(shop.id)} />
              </Flex>

              {/* Stats de la boutique */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} mt={8}>
                <VStack spacing={2}>
                  <Text fontSize="3xl" fontWeight="900" color={accentColor}>
                    {products?.length || 0}
                  </Text>
                  <Text fontSize="sm" color={textSecondary} fontWeight="600" textTransform="uppercase">
                    Produits
                  </Text>
                </VStack>
                <VStack spacing={2}>
                  <Text fontSize="3xl" fontWeight="900" color={accentColor}>
                    {reviewCount}
                  </Text>
                  <Text fontSize="sm" color={textSecondary} fontWeight="600" textTransform="uppercase">
                    Avis
                  </Text>
                </VStack>
                <VStack spacing={2}>
                  <Text fontSize="3xl" fontWeight="900" color={accentColor}>
                    {shop.followers_count || 0}
                  </Text>
                  <Text fontSize="sm" color={textSecondary} fontWeight="600" textTransform="uppercase">
                    Abonnés
                  </Text>
                </VStack>
                <VStack spacing={2}>
                  <HStack spacing={1}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon 
                        key={star} 
                        as={star <= 4 ? FaStar : FaRegStar} // Note fictive de 4/5
                        color={star <= 4 ? "yellow.400" : "gray.300"}
                        boxSize={4}
                      />
                    ))}
                  </HStack>
                  <Text fontSize="sm" color={textSecondary} fontWeight="600" textTransform="uppercase">
                    Note
                  </Text>
                </VStack>
              </SimpleGrid>
            </Box>

            {/* ⭐ Avis Clients - Style moderne */}
            <Box
              mb={12}
              border="1px solid"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Button
                w="100%"
                justifyContent="space-between"
                onClick={() => setReviewsOpen(!reviewsOpen)}
                bg={bgColor}
                _hover={{ bg: subtleBg }}
                py={6}
                px={8}
                rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} boxSize={5} />}
                borderRadius="none"
              >
                <HStack spacing={4}>
                  <Text fontSize="xl" fontWeight="700" color={textPrimary} textTransform="uppercase">
                    Avis Clients
                  </Text>
                  {reviewCount > 0 && (
                    <Badge 
                      bg={accentColor}
                      color="white"
                      fontSize="md" 
                      px={3} 
                      py={1} 
                      borderRadius="none"
                      fontWeight="700"
                    >
                      {reviewCount}
                    </Badge>
                  )}
                </HStack>
              </Button>

              <Collapse in={reviewsOpen} animateOpacity>
                <Box p={8} bg={subtleBg}>
                  <Tabs variant="unstyled">
                    <TabList mb={6} borderBottom="1px solid" borderColor={borderColor}>
                      <Tab 
                        fontWeight="600" 
                        color={textSecondary}
                        _selected={{ 
                          color: textPrimary, 
                          borderBottom: "2px solid",
                          borderColor: accentColor
                        }}
                        py={3}
                        px={6}
                        fontSize="lg"
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
                        py={3}
                        px={6}
                        fontSize="lg"
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
              <Heading
                size="2xl"
                mb={12}
                color={textPrimary}
                textAlign="center"
                fontWeight="900"
                letterSpacing="tight"
                textTransform="uppercase"
                position="relative"
                _after={{
                  content: '""',
                  position: 'absolute',
                  bottom: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '3px',
                  bg: accentColor,
                }}
              >
                Notre Collection
              </Heading>

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
                <VStack spacing={16} align="stretch">
                  {/* Produits sans catégorie */}
                  {(() => {
                    const uncategorized = (products || []).filter((p) => !p.category_id)
                    if (uncategorized.length === 0) return null
                    return (
                      <Box>
                        <Heading
                          size="lg"
                          mb={8}
                          color={textPrimary}
                          fontWeight="700"
                          letterSpacing="tight"
                          textTransform="uppercase"
                          borderLeft="4px solid"
                          borderColor={accentColor}
                          pl={4}
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
                          gap={8}
                          w="100%"
                        >
                          {uncategorized.map((product) => (
                            <GridItem key={product.id} minW="0">
                              <ProductCard
                                id={String(product.id)}
                                title={product.title || product.name || ''}
                                description={product.description || product.details || ''}
                                price={product.price ?? product.amount}
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
                          size="lg"
                          mb={8}
                          color={textPrimary}
                          fontWeight="700"
                          letterSpacing="tight"
                          textTransform="uppercase"
                          borderLeft="4px solid"
                          borderColor={accentColor}
                          pl={4}
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
                          gap={8}
                          w="100%"
                        >
                          {(categorizedProducts[category.id] || []).map((product) => (
                            <GridItem key={product.id} minW="0">
                              <ProductCard
                                id={String(product.id)}
                                title={product.title || product.name || ''}
                                description={product.description || product.details || ''}
                                price={product.price ?? product.amount}
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