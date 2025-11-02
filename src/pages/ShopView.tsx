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
  Icon
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import api from '../services/api'
import FollowButton from '../components/FollowButton'
import ProductCard from '../components/ProductCard'
import BackButton from '../components/BackButton'
import ReviewForm from '../components/ReviewForm'
import ReviewsList from '../components/ReviewsList'

interface Category { id: number; name: string }

export default function ShopView() {
  const { domain } = useParams()
  const location = useLocation()
  const [shop, setShop] = useState<Record<string, any> | null>(null)
  const [products, setProducts] = useState<any[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categorizedProducts, setCategorizedProducts] = useState<Record<number, any[]>>({})
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const cardHeight = useBreakpointValue({ base: '90px', md: '180px' })

  useEffect(() => {
    async function load() {
      try {
        if (!domain) return
        const s = await api.shops.byDomain(domain)
        setShop(s)

        // Try a dedicated endpoint first, fall back to filtering products list
        let found: any[] = []
        try {
          const all = await api.products.list()
          found = Array.isArray(all) ? all.filter((p: any) => String(p.seller_id) === String(s.owner_id) || String(p.shop_id) === String(s.id)) : []
        } catch (error_) {
          console.warn('Failed to load shop-specific products, falling back', error_)
          found = []
        }

        setProducts(found)

        try {
          const cats = await api.categories.list()
          setCategories(cats || [])
        } catch (err) {
          console.warn('Failed to load categories for shop view', err)
          setCategories([])
        }

        // Load review count
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
    <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton to={location.state?.from} />
      {shop === null ? (
        <Spinner />
      ) : (
        <>
          {/* Shop Header */}
          <Box mb={6} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={4}>
            <div>
              <Heading size="xl" mb={2}>{shop.name || shop.domain}</Heading>
              <Text color="gray.300" fontSize="md">{shop.description}</Text>
            </div>
            <FollowButton id={String(shop.id)} />
          </Box>

          {/* Compact Reviews Section */}
          <Box 
            mb={6} 
            borderRadius="xl" 
            overflow="hidden"
            bg="white"
            boxShadow="md"
            border="1px solid"
            borderColor="gray.100"
          >
            <Button
              width="100%"
              justifyContent="space-between"
              onClick={() => setReviewsOpen(!reviewsOpen)}
              bg="gray.50"
              _hover={{ bg: 'gray.100' }}
              borderRadius="0"
              py={6}
              px={6}
              rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} boxSize={6} />}
            >
              <HStack spacing={3}>
                <Text fontSize="lg" fontWeight={700} color="gray.800">
                  📝 Avis clients
                </Text>
                {reviewCount > 0 && (
                  <Badge colorScheme="brand" fontSize="md" px={3} py={1} borderRadius="full">
                    {reviewCount}
                  </Badge>
                )}
              </HStack>
            </Button>

            <Collapse in={reviewsOpen} animateOpacity>
              <Box p={6} bg="gray.50">
                <Tabs colorScheme="brand" variant="soft-rounded">
                  <TabList mb={4}>
                    <Tab fontWeight={600}>Voir les avis</Tab>
                    <Tab fontWeight={600}>Laisser un avis</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel px={0}>
                      <Box 
                        maxH="500px" 
                        overflowY="auto" 
                        css={{
                          '&::-webkit-scrollbar': { width: '8px' },
                          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' },
                          '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '10px' },
                          '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
                        }}
                      >
                        <ReviewsList shopId={String(shop.id)} />
                      </Box>
                    </TabPanel>

                    <TabPanel px={0}>
                      <ReviewForm 
                        shopId={String(shop.id)} 
                        onSuccess={() => {
                          setReviewCount(prev => prev + 1)
                          // Optionally switch to reviews tab after submission
                        }} 
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </Collapse>
          </Box>

          {/* Products Section */}
          <Box 
            bg="white" 
            p={6} 
            borderRadius="xl" 
            boxShadow="md"
            border="1px solid"
            borderColor="gray.100"
          >
            <Heading size="lg" mb={6} color="gray.800">
              🛍️ Nos produits
            </Heading>
            
            {products === null && <Spinner />}
            {products !== null && products.length === 0 && (
              <Text color="gray.600" textAlign="center" py={8}>
                Aucun produit trouvé pour cette boutique.
              </Text>
            )}
            {products !== null && products.length > 0 && (
              <VStack spacing={8} align="stretch">
                {/* Uncategorized */}
                {(() => {
                  const uncategorized = (products || []).filter(p => !p.category_id)
                  if (uncategorized.length === 0) return null
                  return (
                    <Box bg="brand.700" p={{ base: 4, md: 6 }} borderRadius="xl" boxShadow="sm">
                      <Heading size="md" mb={4} color="white" textAlign="center">
                        Autres produits
                      </Heading>
                      <Grid 
                        templateColumns={{ 
                          base: 'repeat(2, 1fr)', 
                          sm: 'repeat(3, 1fr)', 
                          md: 'repeat(4, 1fr)', 
                          lg: 'repeat(5, 1fr)' 
                        }} 
                        gap={3}
                      >
                        {uncategorized.map((product) => (
                          <GridItem key={product.id}>
                            <ProductCard
                              id={String(product.id)}
                              title={product.title || product.name || ''}
                              price={product.price ?? product.amount}
                              image_url={product.image_url ?? product.product_image}
                              images={product.images}
                              quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
                              height={cardHeight}
                            />
                          </GridItem>
                        ))}
                      </Grid>
                    </Box>
                  )
                })()}

                {/* Per-category sections */}
                {categories
                  .filter(category => (categorizedProducts[category.id] || []).length > 0)
                  .map(category => (
                    <Box 
                      key={category.id} 
                      bg="#9d7b6a77" 
                      color="white" 
                      p={{ base: 4, md: 6 }} 
                      borderRadius="xl" 
                      boxShadow="sm"
                    >
                      <Heading size="md" mb={4} textAlign="center" color="white">
                        {category.name}
                      </Heading>
                      <Grid 
                        templateColumns={{ 
                          base: 'repeat(2, 1fr)', 
                          sm: 'repeat(3, 1fr)', 
                          md: 'repeat(4, 1fr)', 
                          lg: 'repeat(5, 1fr)' 
                        }} 
                        gap={3}
                      >
                        {(categorizedProducts[category.id] || []).map((product) => (
                          <GridItem key={product.id}>
                            <ProductCard
                              id={String(product.id)}
                              title={product.title || product.name || ''}
                              price={product.price ?? product.amount}
                              image_url={product.image_url ?? product.product_image}
                              images={product.images}
                              quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
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
  )
}