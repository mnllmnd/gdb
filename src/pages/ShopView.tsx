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
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
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
  const cardHeight = useBreakpointValue({ base: '140px', md: '200px' })

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
    <Box w="100vw" overflowX="hidden" bg="gray.50">
      {/* 🏞️ Hero section */}
      {shop?.banner_url ? (
        <Box
          position="relative"
          w="100%"
          h={{ base: '220px', md: '300px' }}
          mb={-10}
          borderBottom="1px solid"
          borderColor="gray.200"
          overflow="hidden"
        >
          <Image
            src={shop.banner_url}
            alt={shop.name}
            w="100%"
            h="100%"
            objectFit="cover"
            filter="brightness(0.6)"
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
          >
            <Heading
              color="white"
              fontSize={{ base: '2xl', md: '4xl' }}
              fontWeight="700"
              textShadow="0px 3px 6px rgba(0,0,0,0.5)"
            >
              {shop.name || shop.domain}
            </Heading>
            <Text color="whiteAlpha.900" mt={2} fontSize={{ base: 'sm', md: 'md' }}>
              Découvrez nos produits et créations uniques
            </Text>
          </Box>
        </Box>
      ) : null}

      <Container maxW="container.lg" py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }}>
        <BackButton to={location.state?.from} />

        {shop === null ? (
          <Spinner />
        ) : (
          <>
            {/* 🧾 Description Boutique */}
            <Box
              mb={10}
              p={{ base: 5, md: 8 }}
              borderRadius="2xl"
              bg="white"
              boxShadow="sm"
              border="1px solid"
              borderColor="gray.100"
              _hover={{ boxShadow: 'md', transition: '0.3s ease' }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Heading size="lg" color="gray.800" fontWeight="700">
                  À propos de la boutique
                </Heading>
                <FollowButton id={String(shop.id)} />
              </Box>

              <Divider my={4} />

              <Text
                color="gray.700"
                fontSize={{ base: 'sm', md: 'md' }}
                lineHeight="tall"
                whiteSpace="pre-line"
                borderLeft="4px solid #C19A6B"
                pl={4}
              >
                {shop.description || "Cette boutique n'a pas encore ajouté de description."}
              </Text>
            </Box>

            {/* ⭐ Avis Clients */}
            <Box
              mb={10}
              borderRadius="2xl"
              overflow="hidden"
              bg="white"
              boxShadow="sm"
              border="1px solid"
              borderColor="gray.100"
            >
              <Button
                w="100%"
                justifyContent="space-between"
                onClick={() => setReviewsOpen(!reviewsOpen)}
                bg="gray.50"
                _hover={{ bg: 'gray.100' }}
                borderRadius="0"
                py={5}
                px={4}
                rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} boxSize={6} />}
              >
                <HStack spacing={3}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                    Avis clients
                  </Text>
                  {reviewCount > 0 && (
                    <Badge colorScheme="yellow" fontSize="md" px={3} py={1} borderRadius="full">
                      {reviewCount}
                    </Badge>
                  )}
                </HStack>
              </Button>

              <Collapse in={reviewsOpen} animateOpacity>
                <Box p={6} bg="gray.50">
                  <Tabs colorScheme="yellow" variant="soft-rounded">
                    <TabList mb={4}>
                      <Tab fontWeight={600}>Voir les avis</Tab>
                      <Tab fontWeight={600}>Laisser un avis</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel px={0}>
                        <Box
                          maxH="400px"
                          overflowY="auto"
                          css={{
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-thumb': {
                              background: '#bbb',
                              borderRadius: '10px',
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

            {/* 🛒 Produits */}
            <Box
              bg="white"
              p={{ base: 5, md: 8 }}
              borderRadius="2xl"
              boxShadow="md"
              border="1px solid"
              borderColor="gray.100"
            >
              <Heading
                size="lg"
                mb={8}
                color="gray.800"
                textAlign="center"
                fontWeight="700"
                letterSpacing="wide"
              >
                Nos produits
              </Heading>

              {products === null && <Spinner />}
              {products !== null && products.length === 0 && (
                <Text color="gray.500" textAlign="center" py={8}>
                  Aucun produit disponible pour le moment.
                </Text>
              )}

              {products && products.length > 0 && (
                <VStack spacing={10} align="stretch">
                  {/* Produits sans catégorie */}
                  {(() => {
                    const uncategorized = (products || []).filter((p) => !p.category_id)
                    if (uncategorized.length === 0) return null
                    return (
                      <Box>
                        <Heading
                          size="md"
                          mb={5}
                          color="gray.800"
                          textAlign="left"
                          borderLeft="4px solid #C19A6B"
                          pl={3}
                        >
                          Autres produits
                        </Heading>
                        <Grid
                          templateColumns={{
                            base: 'repeat(2, 1fr)',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(4, 1fr)',
                          }}
                          gap={5}
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
                          size="md"
                          mb={5}
                          color="gray.800"
                          textAlign="left"
                          borderLeft="4px solid #C19A6B"
                          pl={3}
                        >
                          {category.name}
                        </Heading>
                        <Grid
                          templateColumns={{
                            base: 'repeat(2, 1fr)',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(4, 1fr)',
                          }}
                          gap={5}
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
