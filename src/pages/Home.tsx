import React from 'react'
import {
  Heading,
  Text,
  Container,
  Button,
  Spinner,
  VStack,
  Box,
  Image,
  Center,
  useBreakpointValue,
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
  Fade,
  ScaleFade,
  SimpleGrid,
  Icon,
  Card,
  CardBody,
} from '@chakra-ui/react'
import { CloseIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { FiPackage, FiTrendingUp, FiShoppingBag } from 'react-icons/fi'
import FilterNav from '../components/FilterNav'
import AppTutorial from '../components/AppTutorial'
import ShopCard from '../components/ShopCard'
import ProductCard from '../components/ProductCard'
import HeroNike from '../components/HeroNike'
import HeroProductStrip from '../components/HeroProductStrip'
import { Link as RouterLink } from 'react-router-dom'
import api from '../services/api'

interface Product {
  id: number
  title?: string
  name?: string
  description?: string
  price?: number
  amount?: number
  category_id?: number | null
  image_url?: string
  product_image?: string
  images?: string[] | any
  [key: string]: string | number | null | undefined | string[] | any
}

interface Category {
  id: number
  name: string
}

interface Shop {
  id: number
  name: string
  followers?: number
}

// ✅ Fonction utilitaire pour normaliser les images
const normalizeImages = (product: Product): string[] => {
  if (Array.isArray(product.images)) {
    return product.images.filter((img): img is string => typeof img === 'string' && img.trim() !== '')
  }
  
  const mainImage = product.image_url ?? product.product_image
  if (mainImage && typeof mainImage === 'string' && mainImage.trim() !== '') {
    return [mainImage]
  }
  
  return []
}

export default function Home() {
  const [shops, setShops] = React.useState<Shop[]>([])
  const [popularShops, setPopularShops] = React.useState<Shop[]>([])
  const [shopsMap, setShopsMap] = React.useState<Record<string, any>>({})
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [categorizedProducts, setCategorizedProducts] = React.useState<Record<number, Product[]>>({})
  
  const [currentView, setCurrentView] = React.useState<'shops' | 'products'>(() => {
    const savedView = localStorage.getItem('homeView')
    return savedView === 'shops' ? 'shops' : 'products'
  })

  React.useEffect(() => {
    localStorage.setItem('homeView', currentView)
  }, [currentView])

  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showScrollTop, setShowScrollTop] = React.useState(false)

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('homeScroll', String(window.scrollY))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  React.useEffect(() => {
    const savedScroll = localStorage.getItem('homeScroll')
    if (savedScroll) {
      window.scrollTo(0, Number(savedScroll))
    }
  }, [])

  const cardHeight = useBreakpointValue({ base: '120px', md: '200px' })
  const cardWidth = useBreakpointValue({ base: '45%', sm: '45%', md: '180px' })
  const initialCount = useBreakpointValue({ base: 4, md: 6 }) || 6
  
  const bgGradient = useColorModeValue(
    'linear(to-br, brand.500, brand.600)',
    'linear(to-br, brand.600, brand.700)'
  )
  const sectionBg = useColorModeValue('white', 'gray.800')
  const categoryBg = useColorModeValue('white', 'brand.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400')

  // paging/visibility for detailed category sections removed — using immersive strip instead

  React.useEffect(() => {
    async function loadData() {
      try {
        const [shopsData, categoriesData, productsData, popularData] = await Promise.all([
          api.shops.list(),
          api.categories.list(),
          api.products.list(),
          api.shops.popular(),
        ])
        
        setShops(shopsData)
        const byId: Record<string, any> = {}
        const byOwner: Record<string, any> = {}
        ;(shopsData || []).forEach((s: any) => {
          if (s?.id) byId[String(s.id)] = s
          if (s?.owner_id) byOwner[String(s.owner_id)] = s
        })
        setShopsMap({ byId, byOwner })
        setCategories(categoriesData)
        setProducts(productsData)
        setPopularShops(popularData || [])
        
        const productsByCategory: Record<number, Product[]> = {}
        if (productsData) {
          for (const product of productsData as Product[]) {
            if (!product?.id) continue
            const categoryId = product.category_id ?? 0
            if (!productsByCategory[categoryId]) {
              productsByCategory[categoryId] = []
            }
            productsByCategory[categoryId].push(product)
          }
        }
        setCategorizedProducts(productsByCategory)
      } catch (err) {
        console.error('Failed to load data', err)
        setShops([])
        setProducts([])
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  React.useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      const productsData = await api.products.list()
      setProducts(productsData?.slice(0, 12) || [])
      return
    }

    setIsLoading(true)
    try {
      if (currentView === 'products') {
        const allProducts = await api.products.list()
        const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

        const filteredProducts = allProducts?.filter((product: Product) => {
          const searchText = `${product.title || product.name || ''} ${product.description || ''}`.toLowerCase()
          return searchTerms.every(term => searchText.includes(term))
        }) || []
        setProducts(filteredProducts)
      } else {
        const results = await api.shops.search(searchQuery.trim())
        setShops(results)
      }
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentView])

  React.useEffect(() => {
    // @ts-ignore
    globalThis.handleGlobalSearch = handleSearch
  }, [handleSearch])

  React.useEffect(() => {
    const map: Record<number, Product[]> = {}
    for (const p of products) {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    }
    setCategorizedProducts(map)
  }, [products])

  React.useEffect(() => {
    let isMounted = true

    const reloadData = async () => {
      setIsLoading(true)
      try {
        if (currentView === 'products') {
          const productsData = await api.products.list()
          if (isMounted) setProducts(productsData?.slice(0, 12) || [])
        } else {
          const shopsData = await api.shops.list()
          if (isMounted) setShops(shopsData)
        }
      } catch (err) {
        console.error('Reload failed', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    reloadData()
    return () => { isMounted = false }
  }, [currentView])

  const renderShopsView = () => {
    if (!shops?.length) {
      return <NoResults message="Aucune boutique trouvée" onClear={() => handleSearch('')} />
    }

    return (
      <ScaleFade in={!isLoading} initialScale={0.95}>
        <VStack spacing={8} align="stretch">
          {popularShops && popularShops.length > 0 && (
            <Box>
              <Card
                bg={sectionBg}
                borderRadius="xl"
                boxShadow="md"
                border="1px solid"
                borderColor={borderColor}
                overflow="hidden"
              >
                <CardBody p={6}>
                  <HStack spacing={3} mb={4}>
                    <Box
                      p={2}
                      bg="orange.50"
                      borderRadius="lg"
                    >
                      <Icon as={FiTrendingUp} boxSize={6} color="orange.500" />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="md" color={textColor}>
                         Boutiques populaires
                      </Heading>
                      <Text fontSize="sm" color={secondaryTextColor}>
                        Les plus suivies par la communauté
                      </Text>
                    </VStack>
                    <Badge
                      ml="auto"
                      colorScheme="orange"
                      fontSize="md"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {popularShops.length}
                    </Badge>
                  </HStack>
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={4}>
                    {popularShops.map((s) => (
                      <Box key={s.id} height="100%">
                        <ShopCard {...s} id={String(s.id)} height={cardHeight} />
                      </Box>
                    ))}
                  </SimpleGrid>
                </CardBody>
              </Card>
            </Box>
          )}

          <Card
            bg={sectionBg}
            borderRadius="xl"
            boxShadow="md"
            border="1px solid"
            borderColor={borderColor}
          >
            <CardBody p={6}>
              <HStack spacing={3} mb={4}>
                <Box
                  p={2}
                  bg="brand.50"
                  borderRadius="lg"
                >
                  <Icon as={FiShoppingBag} boxSize={6} color="brand.500" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={textColor}>
                    Toutes les boutiques
                  </Heading>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    Explorez notre sélection complète
                  </Text>
                </VStack>
                <Badge
                  ml="auto"
                  colorScheme="brand"
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {shops.length - (popularShops?.length || 0)}
                </Badge>
              </HStack>
              <SimpleGrid 
                columns={{ base: 2, sm: 2, md: 3, lg: 4 }} 
                spacing={4}
              >
                {(() => {
                  const popularIds = new Set((popularShops || []).map(p => String(p.id)))
                  const filtered = (shops || []).filter(s => !popularIds.has(String(s.id)))
                  return filtered.map((shop) => (
                    <Box 
                      key={shop.id} 
                      transition="all 0.3s ease"
                      _hover={{ transform: 'translateY(-4px)' }}
                      height="100%"
                    >
                      <ShopCard 
                        {...shop} 
                        id={String(shop.id)} 
                        compact 
                        height={cardHeight}
                      />
                    </Box>
                  ))
                })()}
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </ScaleFade>
    )
  }



  return (
    <Box minH="100vh" bg={pageBg}>
      <AppTutorial />
      <FilterNav 
        view={currentView} 
        onViewChange={setCurrentView}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Hero section (immersive) */}
      <HeroNike />

  {/* Bande immersive de vrais produits (grands visuels, clic -> produit/boutique) */}
  <HeroProductStrip products={products.slice(0, 6)} shopsMap={shopsMap} />

      {/* Two-column promo tiles using real products (first two available) */}
      <Box as="section" px={{ base: 4, md: 6 }} py={8}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {(products || []).slice(0, 2).map((p) => {
            const imgs = normalizeImages(p as any)
            const img = imgs && imgs.length ? imgs[0] : '/img/b.jfif'
            const shop = ((shopsMap.byId && shopsMap.byId[String((p as any).shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String((p as any).seller_id)])) || null
            const shopDomain = shop?.domain || shop?.name
            const target = shopDomain ? `/shop/${shopDomain}?product=${(p as any).id}` : `/products/${(p as any).id}`

            return (
              <Box key={(p as any).id} position="relative" borderRadius="xl" overflow="hidden" minH={{ base: '220px', md: '420px' }}>
                <Image src={String(img)} alt={String(p.title || (p as any).name || 'product')} objectFit="cover" w="100%" h="100%" />
                <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(0,0,0,0.0), rgba(0,0,0,0.55))" />
                <Box position="absolute" left={{ base: 4, md: 12 }} bottom={{ base: 6, md: 12 }} color="white" zIndex={2} maxW={{ md: 'lg' }}>
                  <Text fontSize="sm" textTransform="uppercase" letterSpacing="wider">{(p as any).category_name || ''}</Text>
                  <Heading size={{ base: 'lg', md: '2xl' }} mt={2}>{p.title || (p as any).name}</Heading>
                  <Button mt={4} as={RouterLink} to={target} bg="white" color="black" borderRadius="full" px={6} py={4} fontWeight={700}>Acheter</Button>
                </Box>
              </Box>
            )
          })}
        </SimpleGrid>
      </Box>

      <Container id="products-grid" maxW={{ base: '100%', lg: '90%', xl: '85%' }} py={8} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Box position="relative">
                <Spinner 
                  size="xl" 
                  color="brand.500" 
                  thickness="4px"
                  speed="0.8s"
                />
                <Icon 
                  as={FiPackage} 
                  position="absolute" 
                  top="50%" 
                  left="50%" 
                  transform="translate(-50%, -50%)"
                  boxSize={6}
                  color="brand.500"
                />
              </Box>
              <Text color={textColor} fontSize="lg" fontWeight="500">
                Chargement en cours...
              </Text>
            </VStack>
          </Center>
        ) : (
          currentView === 'products' ? (
            <Fade in={!isLoading}>
              {/* Remplacement: afficher la bande immersive de produits au lieu des sections catégories */}
              <VStack spacing={8} align="stretch">
                <HeroProductStrip products={products} shopsMap={shopsMap} />
              </VStack>
            </Fade>
          ) : renderShopsView()
        )}
      </Container>

      {/* Bouton scroll to top moderne */}
      <IconButton
        aria-label="Remonter en haut"
        icon={<ArrowUpIcon />}
        position="fixed"
        right={{ base: 4, md: 8 }}
        bottom={{ base: 80, md: 12 }}
        zIndex={2000}
        borderRadius="full"
        boxShadow="xl"
        size="lg"
        display={showScrollTop ? 'inline-flex' : 'none'}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        colorScheme="brand"
        transition="all 0.3s"
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: '2xl'
        }}
      />
    </Box>
  )
}

function NoResults({ message, onClear }: { readonly message: string; readonly onClear: () => void }) {
  const textColor = useColorModeValue('gray.700', 'gray.400')
  const bgColor = useColorModeValue('white', 'gray.800')
  
  return (
    <Center py={16}>
      <Card
        maxW="md"
        bg={bgColor}
        borderRadius="2xl"
        boxShadow="xl"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <CardBody p={10}>
          <VStack spacing={5} textAlign="center">
            <Box
              p={5}
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderRadius="full"
              border="2px dashed"
              borderColor={useColorModeValue('gray.300', 'gray.600')}
            >
              <Icon as={FiPackage} boxSize={12} color="gray.400" />
            </Box>
            <VStack spacing={2}>
              <Heading size="md" color={textColor}>
                {message}
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.500')} fontSize="sm">
                Essayez de modifier vos critères de recherche
              </Text>
            </VStack>
            <Button
              colorScheme="brand"
              size="lg"
              borderRadius="full"
              onClick={onClear}
              rightIcon={<CloseIcon />}
              fontWeight="600"
            >
              Réinitialiser
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Center>
  )
}