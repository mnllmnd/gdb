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
import { CloseIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
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
  logo_url?: string
  domain?: string
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

// Composant Carrousel Boutiques Style Zara/Nike
function ShopsCarousel({ shops, title }: { shops: Shop[]; title: string }) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)
  const [isHovered, setIsHovered] = React.useState(false)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  React.useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      return () => el.removeEventListener('scroll', checkScroll)
    }
  }, [shops])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 320
      const scrollAmount = cardWidth * 2
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <Box
      position="relative"
      my={{ base: 12, md: 16 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* En-tête de section style Nike */}
      <Box px={{ base: 4, md: 8 }} mb={8}>
        <Heading
          as="h2"
          fontSize={{ base: '2xl', md: '4xl' }}
          fontWeight="700"
          letterSpacing="tight"
          color="black"
          textTransform="uppercase"
          position="relative"
          display="inline-block"
          _after={{
            content: '""',
            position: 'absolute',
            bottom: '-8px',
            left: '0',
            width: '60px',
            height: '3px',
            bg: 'black',
          }}
        >
          {title}
        </Heading>
      </Box>

      {/* Contrôles de navigation */}
      <Box position="relative">
        {canScrollLeft && (
          <IconButton
            aria-label="Précédent"
            icon={<ChevronLeftIcon boxSize={6} />}
            position="absolute"
            left={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg="white"
            color="black"
            border="1px solid"
            borderColor="gray.300"
            size="lg"
            opacity={isHovered ? 0.9 : 0}
            _hover={{ 
              bg: "black", 
              color: "white",
              transform: "translateY(-50%) scale(1.1)" 
            }}
            onClick={() => scroll('left')}
            transition="all 0.3s ease"
            boxShadow="lg"
            borderRadius="full"
          />
        )}

        {canScrollRight && (
          <IconButton
            aria-label="Suivant"
            icon={<ChevronRightIcon boxSize={6} />}
            position="absolute"
            right={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg="white"
            color="black"
            border="1px solid"
            borderColor="gray.300"
            size="lg"
            opacity={isHovered ? 0.9 : 0}
            _hover={{ 
              bg: "black", 
              color: "white",
              transform: "translateY(-50%) scale(1.1)" 
            }}
            onClick={() => scroll('right')}
            transition="all 0.3s ease"
            boxShadow="lg"
            borderRadius="full"
          />
        )}

        {/* Carrousel des boutiques style produit */}
        <Box
          ref={scrollRef}
          display="flex"
          overflowX="auto"
          gap={6}
          px={{ base: 4, md: 8 }}
          py={2}
          css={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {shops.map((shop) => {
            const shopHref = shop.domain ? `/shop/${shop.domain}` : `/shop/${shop.id}`
            
            return (
              <Box
                as={RouterLink}
                key={shop.id}
                to={shopHref}
                position="relative"
                bg="ctaBg"
                borderRadius="lg"
                overflow="hidden"
               
                transition="all 0.3s ease"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: 'xl',
                  borderColor: 'gray.200',
                  textDecoration: 'none'
                }}
                cursor="pointer"
                flexShrink={0}
                w={{ base: '280px', md: '320px' }}
                minW={{ base: '280px', md: '320px' }}
              >
                {/* Container image */}
                <Box
                  position="relative"
                  w="100%"
                  h="280px"
                  bg="ctabg"
                  overflow="hidden"
                >
                  {shop.logo_url ? (
                    <Image
                      src={shop.logo_url}
                      alt={shop.name}
                      objectFit="cover"
                      w="100%"
                      h="100%"
                      p={4}
                      transition="transform 0.3s ease"
                      _hover={{ transform: 'scale(1.08)' }}
                    />
                  ) : (
                    <Center h="100%" bg="gray.100">
                      <Text
                        fontSize="6xl"
                        fontWeight="900"
                        color="gray.400"
                        textTransform="uppercase"
                        opacity={0.5}
                      >
                        {shop.name?.charAt(0) || '?'}
                      </Text>
                    </Center>
                  )}
                  
                  {/* Overlay au hover */}
                  <Box
                    position="absolute"
                    inset={0}
                    bg="black"
                    opacity={0}
                    transition="opacity 0.3s ease"
                    _hover={{ opacity: 0.1 }}
                  />
                  
                  {/* Badge followers en overlay */}
                  {shop.followers && shop.followers > 0 && (
                    <Badge
                      position="absolute"
                      top={4}
                      right={4}
                      bg="black"
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="600"
                      letterSpacing="wide"
                      zIndex={2}
                    >
                      {shop.followers.toLocaleString()}
                    </Badge>
                  )}
                </Box>

                {/* Informations de la boutique */}
                <Box p={6}>
                  <VStack spacing={3} align="start">
                    {/* Nom de la boutique */}
                    <Heading
                      as="h3"
                      fontSize="xl"
                      fontWeight="700"
                      color="black"
                      letterSpacing="tight"
                      textTransform="uppercase"
                      lineHeight="1.2"
                      noOfLines={2}
                    >
                      {shop.name}
                    </Heading>

                    {/* Description / CTA */}
                    <HStack justify="space-between" w="100%" pt={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color="gray.600"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        Visiter la boutique
                      </Text>
                      <Text
                        fontSize="lg"
                        fontWeight="700"
                        color="black"
                      >
                        →
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
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
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400')
  const ctaBg = useColorModeValue('white', 'black')
  const ctaColor = useColorModeValue('black', 'white')

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

    const popularIds = new Set((popularShops || []).map(p => String(p.id)))
    const otherShops = (shops || []).filter(s => !popularIds.has(String(s.id)))

    return (
      <ScaleFade in={!isLoading} initialScale={0.95}>
        <VStack spacing={0} align="stretch">
          {/* Boutiques populaires */}
          {popularShops && popularShops.length > 0 && (
            <ShopsCarousel shops={popularShops} title="Boutiques populaires" />
          )}

          {/* Toutes les boutiques */}
          {otherShops.length > 0 && (
            <ShopsCarousel shops={otherShops} title="Toutes les boutiques" />
          )}
        </VStack>
      </ScaleFade>
    )
  }

  return (
    <Box minH="100vh">
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

      {/* Bande immersive de vrais produits */}
      <HeroProductStrip products={products.slice(0, 6)} shopsMap={shopsMap} />

      {/* Two-column promo tiles */}
      <Box as="section" px={{ base: 4, md: 6 }} py={8}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {(products || []).slice(0, 2).map((p) => {
            const imgs = normalizeImages(p as any)
            const img = imgs && imgs.length ? imgs[0] : '/img/b.jfif'
            const shop = ((shopsMap.byId && shopsMap.byId[String((p as any).shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String((p as any).seller_id)])) || null
            const shopDomain = shop?.domain || shop?.name
            const target = shopDomain ? `/shop/${shopDomain}?product=${(p as any).id}` : `/products/${(p as any).id}`

            return (
              <Box
                key={(p as any).id}
                position="relative"
                borderRadius="xl"
                overflow="hidden"
                minH={{ base: '220px', md: '420px' }}
              >
                <Image
                  src={String(img)}
                  alt={String(p.title || (p as any).name || 'product')}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
                
                <Box
                  position="absolute"
                  inset={0}
                  bgGradient="linear(to-b, rgba(0,0,0,0.0), rgba(0,0,0,0.55))"
                />
                
                <Box
                  position="absolute"
                  left={{ base: 4, md: 12 }}
                  bottom={{ base: 6, md: 12 }}
                  color="white"
                  zIndex={2}
                  maxW={{ md: 'lg' }}
                >
                  <Text
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color="white"
                  >
                    {(p as any).category_name || ''}
                  </Text>

                  <Heading
                    size={{ base: 'lg', md: '2xl' }}
                    mt={2}
                    color="white"
                  >
                    {p.title || (p as any).name}
                  </Heading>

                  <Button
                    mt={4}
                    as={RouterLink}
                    to={target}
                    bg={ctaBg}
                    color={ctaColor}
                    borderRadius="full"
                    px={6}
                    py={4}
                    fontWeight={700}
                  >
                    Acheter
                  </Button>
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
              <VStack spacing={8} align="stretch">
                <HeroProductStrip products={products} shopsMap={shopsMap} />
              </VStack>
            </Fade>
          ) : renderShopsView()
        )}
      </Container>

      {/* Bouton scroll to top */}
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