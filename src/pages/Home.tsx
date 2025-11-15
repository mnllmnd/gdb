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
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
  ScaleFade,
  SimpleGrid,
  Icon,
  Card,
  CardBody,
  Fade,
} from '@chakra-ui/react'
import { CloseIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { FiPackage, FiShoppingBag } from 'react-icons/fi'
import FilterNav from '../components/FilterNav'
import AppTutorial from '../components/AppTutorial'
import HeroNike from '../components/HeroNike'
import HeroProductStrip from '../components/HeroProductStrip'
import { Link as RouterLink, useLocation } from 'react-router-dom'
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
function ShopsCarousel({ shops, title }: { readonly shops: Shop[]; readonly title: string }) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)
  const [isHovered, setIsHovered] = React.useState(false)
  
  // Hooks appelés au niveau du composant
  const shopCardBg = useColorModeValue('white', 'black')
  const shopCardBorder = useColorModeValue('gray.200', 'gray.800')
  const shopCardHoverBg = useColorModeValue('gray.50', 'gray.800')
  const shopCardHoverBorder = useColorModeValue('gray.300', 'gray.600')
  const shopCardHoverShadow = useColorModeValue('0 8px 16px rgba(0,0,0,0.08)', '0 8px 16px rgba(0,0,0,0.3)')
  const buttonBg = useColorModeValue('white', 'black')
  const buttonColor = useColorModeValue('black', 'white')
  const buttonBorder = useColorModeValue('gray.200', 'gray.700')
  const imageBg = useColorModeValue('gray.100', 'gray.800')
  const imageIconColor = useColorModeValue('gray.300', 'gray.600')
  const badgeBg = useColorModeValue('gray.900', 'gray.100')
  const badgeColor = useColorModeValue('white', 'gray.900')
  const headingColor = useColorModeValue('black', 'white')
  const textSecondaryColor = useColorModeValue('gray.600', 'gray.400')
  const textHintColor = useColorModeValue('gray.400', 'gray.500')

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
      const cardWidth = 180
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
      {/* En-tête de section minimaliste */}
      <Box px={{ base: 4, md: 8 }} mb={8}>
        <Heading
          as="h2"
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="600"
          letterSpacing="-0.4px"
          color={useColorModeValue('black', 'white')}
          textTransform="capitalize"
          position="relative"
          display="inline-block"
        >
          {title}
        </Heading>
      </Box>

      {/* Contrôles de navigation */}
      <Box position="relative">
        {canScrollLeft && (
          <IconButton
            aria-label="Précédent"
            icon={<ChevronLeftIcon boxSize={5} />}
            position="absolute"
            left={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg={buttonBg}
            color={buttonColor}
            border="1px solid"
            borderColor={buttonBorder}
            size="lg"
            opacity={isHovered ? 1 : 0}
            _hover={{ 
              bg: shopCardHoverBg,
              borderColor: shopCardHoverBorder,
              transform: "translateY(-50%)"
            }}
            onClick={() => scroll('left')}
            transition="all 0.2s ease"
            boxShadow="sm"
            borderRadius="full"
          />
        )}

        {canScrollRight && (
          <IconButton
            aria-label="Suivant"
            icon={<ChevronRightIcon boxSize={5} />}
            position="absolute"
            right={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg={buttonBg}
            color={buttonColor}
            border="1px solid"
            borderColor={buttonBorder}
            size="lg"
            opacity={isHovered ? 1 : 0}
            _hover={{ 
              bg: shopCardHoverBg,
              borderColor: shopCardHoverBorder,
              transform: "translateY(-50%)"
            }}
            onClick={() => scroll('right')}
            transition="all 0.2s ease"
            boxShadow="sm"
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
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="flex-start"
                transition="transform 0.18s ease"
                _hover={{ transform: 'translateY(-6px) scale(1.02)', textDecoration: 'none' }}
                cursor="pointer"
                flexShrink={0}
                w={{ base: '120px', md: '160px' }}
                minW={{ base: '120px', md: '160px' }}
                p={2}
                bg="transparent"
              >
                {/* Circular logo container */}
                <Box
                  position="relative"
                  w={{ base: '96px', md: '140px' }}
                  h={{ base: '96px', md: '140px' }}
                  bg={imageBg}
                  borderRadius="full"
                  overflow="hidden"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="1px solid"
                  borderColor={shopCardBorder}
                >
                  {shop.logo_url ? (
                    <Image
                      src={shop.logo_url}
                      alt={shop.name}
                      objectFit="cover"
                      w="100%"
                      h="100%"
                      transition="transform 0.25s ease"
                      _hover={{ transform: 'scale(1.06)' }}
                    />
                  ) : (
                    <Text
                      fontSize={{ base: '3xl', md: '5xl' }}
                      fontWeight="700"
                      color={imageIconColor}
                      textTransform="uppercase"
                      opacity={0.7}
                    >
                      {shop.name?.charAt(0) || '?'}
                    </Text>
                  )}

                  {/* Badge followers */}
                  {shop.followers && shop.followers > 0 && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      bg={badgeBg}
                      color={badgeColor}
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="600"
                      zIndex={2}
                    >
                      {shop.followers.toLocaleString()}
                    </Badge>
                  )}
                </Box>

                {/* Nom de la boutique */}
                <Text
                  mt={3}
                  textAlign="center"
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="600"
                  color={headingColor}
                  noOfLines={2}
                >
                  {shop.name}
                </Text>
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
  
  const [currentView, setCurrentView] = React.useState<'shops' | 'products'>(() => {
    const savedView = localStorage.getItem('homeView')
    // Par défaut, afficher les boutiques pour les nouveaux visiteurs
    return savedView === 'products' ? 'products' : 'shops'
  })

  React.useEffect(() => {
    localStorage.setItem('homeView', currentView)
  }, [currentView])

  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showScrollTop, setShowScrollTop] = React.useState(false)

  const [welcomeDismissed, setWelcomeDismissed] = React.useState(() => {
    try { return typeof globalThis.window !== 'undefined' && globalThis.localStorage?.getItem('welcomeDismissed') === '1' } catch { return false }
  })

  const currentUser = React.useMemo(() => {
    try {
      const u = typeof globalThis.window !== 'undefined' ? globalThis.localStorage?.getItem('user') : null
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  }, [])

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      globalThis.localStorage?.setItem('homeScroll', String(globalThis.scrollY || 0))
    }
    globalThis.addEventListener?.('beforeunload', handleBeforeUnload)
    return () => globalThis.removeEventListener?.('beforeunload', handleBeforeUnload)
  }, [])

  React.useEffect(() => {
    const savedScroll = globalThis.localStorage?.getItem('homeScroll')
    if (savedScroll) {
      globalThis.scrollTo?.(0, Number(savedScroll))
    }
  }, [])
  
  // If coming back from ProductView we may have a focusProductId to jump to
  const location = useLocation()
  React.useEffect(() => {
    try {
      const state = (location?.state as any) || {}
      const focusId = state.focusProductId || state.from?.focusProductId || null
      if (!focusId) return
      // Try to find the element and jump to it immediately (no smooth scroll)
      let attempts = 0
      const maxAttempts = 10
      const tryJump = () => {
        attempts += 1
        const el = document.getElementById(`product-${String(focusId)}`)
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
          try {
            el.setAttribute('tabindex', '-1');
            (el as HTMLElement).focus();
          } catch {
            // ignore focus error
          }
          try { 
            el.animate(
              [
                { boxShadow: '0 0 0px rgba(0,0,0,0)' }, 
                { boxShadow: '0 0 14px rgba(0,150,136,0.28)' }, 
                { boxShadow: '0 0 0px rgba(0,0,0,0)' }
              ], 
              { duration: 900 }
            ) 
          } catch {
            // ignore animation error
          }
        } else if (attempts < maxAttempts) {
          setTimeout(tryJump, 60)
        }
      }
      tryJump()
    } catch {
      // ignore scroll error
    }
  }, [location])

  // Detect Pinterest mode (url or localStorage) so we can adjust layouts
  const isPinterestMode = React.useMemo(() => {
    try {
      const params = new URLSearchParams(globalThis.location?.search || '')
      if (params.get('view') === 'pinterest') return true
      const saved = typeof globalThis.window !== 'undefined' ? (globalThis.localStorage?.getItem('home:view') || globalThis.localStorage?.getItem('products:view')) : null
      return saved === 'pinterest'
    } catch {
      return false
    }
  }, [location.search])
 
  const sectionBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('black', 'white')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400')
  const ctaBg = useColorModeValue('white', 'black')
  const ctaColor = useColorModeValue('black', 'white')
  const hoverBgVar = useColorModeValue('gray.100', 'gray.800')
  const productBgVar = useColorModeValue('white', 'black')
  const productBorderVar = useColorModeValue('gray.200', 'gray.800')
  const productTextColorVar = useColorModeValue('black', 'white')

  // Products visible according to selected category filter
  const visibleProducts = React.useMemo(() => {
    if (!products) return []
    if (selectedCategory == null) return products
    return products.filter((p) => (p.category_id ?? 0) === selectedCategory)
  }, [products, selectedCategory])

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
    // Welcome popup: show once for logged-in users unless dismissed
    if (!currentUser) return
    if (welcomeDismissed) return
    // Popup removed - minimaliste approach
  }, [currentUser, welcomeDismissed])

  React.useEffect(() => {
    const onScroll = () => {
      const scrollY = globalThis.scrollY ?? 0
      setShowScrollTop(scrollY > 300)
    }
    globalThis.addEventListener?.('scroll', onScroll)
    onScroll()
    return () => globalThis.removeEventListener?.('scroll', onScroll)
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
    // map is used for categorization but not stored
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

      {/* Si l'utilisateur est en vue 'shops', afficher les boutiques dès le haut de page */}
      {currentView === 'shops' && (
        <Box px={{ base: 0, md: 0 }}>
          {/* CTA: montrer que chaque boutique est indépendante + inciter à créer la sienne */}
          <Box px={{ base: 4, md: 6 }} mb={6}>
      <Box
        bg={ctaBg}
        p={{ base: 4, md: 5 }}
        borderRadius="md"
        border="1px solid"
        borderColor={borderColor}
      >
        <HStack
          spacing={4}
          align={{ base: 'flex-start', md: 'center' }}
          justify={{ base: 'center', md: 'space-between' }}
          flexDirection={{ base: 'column', md: 'row' }}
          textAlign={{ base: 'center', md: 'left' }}
        >
          <HStack spacing={3} align="center" justify="center">
            <Icon as={FiShoppingBag} boxSize={5} color={secondaryTextColor} />
            <VStack align={{ base: 'center', md: 'start' }} spacing={0}>
              <Heading as="h2" size="md" fontWeight="600">
                Découvrez des boutiques et produits
              </Heading>
              <Text fontSize="xs" color={secondaryTextColor}>
                Parcourez des centaines de boutiques indépendantes et trouvez des produits uniques près de chez vous.
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={3} mt={{ base: 3, md: 0 }}>
            <Button
              as={RouterLink}
              to="/products"
              colorScheme="brand"
              borderRadius="md"
              px={{ base: 5, md: 5 }}
              py={{ base: 2.5, md: 3 }}
              fontWeight="500"
              width={{ base: 'full', md: 'auto' }}
              fontSize="sm"
            >
              Parcourir le marché
            </Button>

            <Button
              as={RouterLink}
              to="/seller"
              variant="ghost"
              borderRadius="md"
              px={{ base: 5, md: 5 }}
              py={{ base: 2.5, md: 3 }}
              fontWeight="500"
              width={{ base: 'full', md: 'auto' }}
              fontSize="sm"
            >
              Créer ma boutique
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Box>


          {renderShopsView()}
        </Box>
      )}

      {/* Hero section (immersive) */}
      <HeroNike />

  {/* Bande immersive de vrais produits (unique) */}

      {/* Two-column promo tiles */}
      <Box as="section" px={{ base: 4, md: 6 }} py={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {(visibleProducts || []).slice(0, 2).map((p) => {
            const imgs = normalizeImages(p as any)
            const img = imgs?.length ? imgs[0] : '/img/b.jfif'
            const shop = (shopsMap?.byId?.[String((p as any).shop_id)] || shopsMap?.byOwner?.[String((p as any).seller_id)]) || null
            const shopDomain = shop?.domain || shop?.name
            const target = shopDomain ? `/shop/${shopDomain}?product=${(p as any).id}` : `/products/${(p as any).id}`
            const hoverBg = hoverBgVar

            return (
              <Box
                key={(p as any).id}
                position="relative"
                borderRadius="md"
                overflow="hidden"
                minH={{ base: '200px', md: '360px' }}
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
                  bgGradient="linear(to-b, rgba(0,0,0,0.0), rgba(0,0,0,0.4))"
                />
                
                <Box
                  position="absolute"
                  left={{ base: 3, md: 8 }}
                  bottom={{ base: 4, md: 8 }}
                  color="white"
                  zIndex={2}
                  maxW={{ md: 'lg' }}
                >
                  <Text
                    fontSize="xs"
                    textTransform="capitalize"
                    letterSpacing="0.5px"
                    color="white"
                    fontWeight="300"
                  >
                    {(p as any).category_name || ''}
                  </Text>

                  <Heading
                    size={{ base: 'md', md: 'lg' }}
                    mt={1}
                    color="white"
                    fontWeight="300"
                    letterSpacing="-0.3px"
                  >
                    {p.title || (p as any).name}
                  </Heading>

                  <Button
                    mt={3}
                    as={RouterLink}
                    to={target}
                    state={{ from: { pathname: location?.pathname || '/', focusProductId: String((p as any).id) } }}
                    bg={ctaBg}
                    color={ctaColor}
                    borderRadius="md"
                    px={5}
                    py={2}
                    fontWeight="500"
                    size="sm"
                    textTransform="capitalize"
                    letterSpacing="0.3px"
                    fontSize="xs"
                    _hover={{ bg: hoverBg }}
                  >
                    Voir
                  </Button>
                </Box>
              </Box>
            )
          })}
        </SimpleGrid>
      </Box>

      {/* Additional promo tiles were moved to the end of the page (after the carousel) */}

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
                <HeroProductStrip products={visibleProducts} shopsMap={shopsMap} />
              </VStack>
            </Fade>
          ) : null
        )}
      </Container>

      {/* Extra promo tiles moved here: render remaining products after the carousel */}
      {(visibleProducts || []).slice(2).length > 0 && (
        <Box as="section" px={{ base: 4, md: 6 }} py={6}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            {(visibleProducts || []).slice(2).map((p) => {
              const imgs = normalizeImages(p as any)
              const img = imgs?.length ? imgs[0] : '/img/b.jfif'
              const shop = (shopsMap?.byId?.[String((p as any).shop_id)] || shopsMap?.byOwner?.[String((p as any).seller_id)]) || null
              const shopDomain = shop?.domain || shop?.name
              const target = shopDomain ? `/shop/${shopDomain}?product=${(p as any).id}` : `/products/${(p as any).id}`
              
              // Format price minimaliste
              const price = (p as any).price || (p as any).amount
              const numPrice = typeof price === 'number' ? price : (typeof price === 'string' ? Number(price) : null)
              const formattedPrice = numPrice ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(numPrice) : null
              
              const productBg = productBgVar
              const productBorder = productBorderVar
              const productTextColor = productTextColorVar

              return (
                <Box
                  key={(p as any).id}
                  as={RouterLink}
                  to={target}
                  state={{ from: { pathname: location?.pathname || '/', focusProductId: String((p as any).id), isPinterestMode } }}
                  position="relative"
                  overflow="hidden"
                  minH={{ base: '180px', md: '280px' }}
                  display="flex"
                  flexDirection="column"
                  borderRadius="md"
                  bg={productBg}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'sm' }}
                  role="link"
                  transition="all 0.2s ease"
                  border="1px solid"
                  borderColor={productBorder}
                >
                  <Box position="relative" flex="1" overflow="hidden">
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
                      bgGradient="linear(to-b, rgba(0,0,0,0.0), rgba(0,0,0,0.1))"
                    />
                  </Box>

                  {/* Product info section */}
                  <Box 
                    p={3} 
                    borderTop="1px solid" 
                    borderColor={productBorder}
                    bg={productBg}
                  >
                    {/* Product name */}
                    <Heading
                      as="h3"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="300"
                      letterSpacing="0.02em"
                      color={productTextColor}
                      textTransform="uppercase"
                      textAlign="left"
                      noOfLines={2}
                      mb={2}
                      lineHeight="1.3"
                    >
                      {p.title || (p as any).name}
                    </Heading>
                    
                    {/* Price */}
                    {formattedPrice && (
                      <Text 
                        fontSize={{ base: 'md', md: 'lg' }}
                        fontWeight="300" 
                        letterSpacing="0.01em"
                        color={productTextColor}
                        textAlign="left"
                      >
                        {formattedPrice} FCFA
                      </Text>
                    )}
                  </Box>
                </Box>
              )
            })}
          </SimpleGrid>
        </Box>
      )}

      {/* Bouton scroll to top */}
      <IconButton
        aria-label="Remonter en haut"
        icon={<ArrowUpIcon />}
        position="fixed"
        right={{ base: 4, md: 8 }}
        bottom={{ base: 80, md: 12 }}
        zIndex={2000}
        borderRadius="full"
        boxShadow="sm"
        size="lg"
        display={showScrollTop ? 'inline-flex' : 'none'}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        colorScheme="brand"
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'md'
        }}
      />
    </Box>
  )
}

function NoResults({ message, onClear }: { readonly message: string; readonly onClear: () => void }) {
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.900')
  const containerBg = useColorModeValue('gray.100', 'gray.800')
  const containerBorder = useColorModeValue('gray.300', 'gray.700')
  
  return (
    <Center py={16}>
      <Card
        maxW="md"
        bg={bgColor}
        borderRadius="md"
        boxShadow="sm"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.800')}
      >
        <CardBody p={8}>
          <VStack spacing={4} textAlign="center">
            <Box
              p={4}
              bg={containerBg}
              borderRadius="full"
              border="1px solid"
              borderColor={containerBorder}
            >
              <Icon as={FiPackage} boxSize={10} color={useColorModeValue('gray.400', 'gray.500')} />
            </Box>
            <VStack spacing={1.5}>
              <Heading size="md" color={textColor} fontWeight="600">
                {message}
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                Modifiez vos critères de recherche
              </Text>
            </VStack>
            <Button
              colorScheme="brand"
              size="md"
              borderRadius="md"
              onClick={onClear}
              rightIcon={<CloseIcon />}
              fontWeight="500"
              fontSize="sm"
            >
              Réinitialiser
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Center>
  )
}