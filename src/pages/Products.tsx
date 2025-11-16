import React from 'react'
import {
  Container,
  Heading,
  Grid,
  Box,
  Spinner,
  Center,
  Text,
  InputGroup,
  InputLeftElement,
  Input,
  InputRightElement,
  IconButton,
  Flex,
  Badge,
  VStack,
  HStack,
  useBreakpointValue,
  Card,
  CardBody,
  Button,
  Icon,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Image,
  AspectRatio,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
} from '@chakra-ui/react'
import { CloseIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { FiPackage, FiGrid, FiFilter, FiTrendingUp, FiMenu, FiCheck, FiDollarSign } from 'react-icons/fi'
import ProductCard from '../components/ProductCard'
import api from '../services/api'
import { useLocation, useNavigate } from 'react-router-dom'
import ScrollTopButton from '../components/ScrollTopButton'
import { Tooltip } from "@chakra-ui/react";


// Composant Carrousel pour les produits
function ProductsCarousel({ products, title, shopsMap, isPinterestMode }: { products: any[]; title: string; shopsMap: Record<string, any>; isPinterestMode: boolean }) {
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
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = isPinterestMode ? 200 : 280
      const scrollAmount = cardWidth * 2
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const accentColor = useColorModeValue('#111111', 'white')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')

  return (
    <Box
      position="relative"
      mb={12}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <HStack spacing={4} mb={6} align="center" justify="space-between" px={2}>
        <HStack spacing={4} align="center">
          <Box w="4px" h="28px" bg={accentColor} borderRadius="none" />
          <VStack align="start" spacing={1}>
            <Heading size="xl" fontWeight="700" color={accentColor} letterSpacing="-0.5px">
              {title}
            </Heading>
            <Text color={useColorModeValue('#666666', 'gray.400')} fontSize="md" fontWeight="400">
              {products.length} produit{products.length > 1 ? 's' : ''}
            </Text>
          </VStack>
        </HStack>

        {products.length > 4 && (
          <HStack spacing={2}>
            <Text fontSize="sm" color={useColorModeValue('#666666', 'gray.400')} fontWeight="500">
              Faites défiler
            </Text>
            <Icon as={ChevronRightIcon} color={useColorModeValue('#666666', 'gray.400')} />
          </HStack>
        )}
      </HStack>

      <Box position="relative">
        {canScrollLeft && (
          <IconButton
            aria-label="Précédent"
            icon={<ChevronLeftIcon boxSize={6} />}
            position="absolute"
            left={-4}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg="white"
            color="black"
            border="1px solid"
            borderColor={borderColor}
            size="lg"
            opacity={isHovered ? 1 : 0}
            _hover={{ 
              bg: "black", 
              color: "white",
              transform: "translateY(-50%) scale(1.1)" 
            }}
            onClick={() => scroll('left')}
            transition="all 0.3s ease"
            boxShadow="xl"
            borderRadius="none"
          />
        )}

        {canScrollRight && (
          <IconButton
            aria-label="Suivant"
            icon={<ChevronRightIcon boxSize={6} />}
            position="absolute"
            right={-4}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg="white"
            color="black"
            border="1px solid"
            borderColor={borderColor}
            size="lg"
            opacity={isHovered ? 1 : 0}
            _hover={{ 
              bg: "black", 
              color: "white",
              transform: "translateY(-50%) scale(1.1)" 
            }}
            onClick={() => scroll('right')}
            transition="all 0.3s ease"
            boxShadow="xl"
            borderRadius="none"
          />
        )}

        <Box
          ref={scrollRef}
          display="flex"
          overflowX="auto"
          gap={6}
          py={2}
          css={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {products.map((p) => {
            const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
            return (
              <Box
                key={p.id}
                flexShrink={0}
                width={isPinterestMode ? { base: '160px', md: '200px' } : { base: '280px', md: '320px' }}
                minWidth={isPinterestMode ? { base: '160px', md: '200px' } : { base: '280px', md: '320px' }}
              >
                {isPinterestMode ? (
                  <PinterestProductCard
                    product={p}
                    shop={shop}
                  />
                ) : (
                  <ProductCard
                    id={String(p.id)}
                    title={p.title || p.name}
                    price={p.price ?? p.amount}
                    originalPrice={p.original_price ?? p.price ?? p.amount}
                    discount={p.discount ?? 0}
                    description={p.description}
                    image_url={p.image_url ?? p.product_image}
                    images={p.images}
                    quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                    shopId={shop?.id || p.shop_id || p.seller_id}
                    shopName={shop?.name}
                    shopDomain={shop?.domain}
                    height={{ base: '320px', md: '380px' }}
                    isPinterestMode={isPinterestMode}
                  />
                )}
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

// Composant Pinterest (images seulement)
function PinterestProductCard({ product, shop }: { product: any; shop: any }) {
  const navigate = useNavigate()
  const location = useLocation()
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const hoverBorderColor = useColorModeValue('#111111', 'white')

  const handleClick = () => {
    try {
      const path = location?.pathname || '/products'
      navigate(`/products/${product.id}`, {
        state: { from: { pathname: path, focusProductId: String(product.id), isPinterestMode: true } }
      })
      return
    } catch (err) {
      // fallback
    }
    navigate(`/products/${product.id}`)
  }

  const imageUrl = product.image_url ?? product.product_image ?? product.images?.[0]

  return (
    <Box
      cursor="pointer"
      onClick={handleClick}
      transition="all 0.3s ease"
      _hover={{ 
        transform: 'scale(1.02)',
        borderColor: hoverBorderColor
      }}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="none"
      overflow="hidden"
      bg="white"
    >
      <AspectRatio ratio={3/4}>
        <Image
          src={imageUrl}
          alt={product.title || product.name}
          objectFit="cover"
          w="100%"
          h="100%"
          fallback={
            <Center bg="gray.100" w="100%" h="100%">
              <Icon as={FiPackage} boxSize={8} color="gray.400" />
            </Center>
          }
        />
      </AspectRatio>
    </Box>
  )
}

// Composant pour le filtre de prix en FCFA
function PriceFilter({ minPrice, maxPrice, onPriceChange, onApplyPriceFilter }: { 
  minPrice: number, 
  maxPrice: number, 
  onPriceChange: (min: number, max: number) => void,
  onApplyPriceFilter: () => void 
}) {
  const [localMinPrice, setLocalMinPrice] = React.useState(minPrice)
  const [localMaxPrice, setLocalMaxPrice] = React.useState(maxPrice)

  const handleSliderChange = (values: number[]) => {
    setLocalMinPrice(values[0])
    setLocalMaxPrice(values[1])
  }

  const handleApply = () => {
    onPriceChange(localMinPrice, localMaxPrice)
    onApplyPriceFilter()
  }

  const handleReset = () => {
    setLocalMinPrice(0)
    setLocalMaxPrice(1000000)
    onPriceChange(0, 1000000)
  }

  // Fonction pour formater les prix en FCFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' FCFA'
  }

  return (
    <VStack spacing={4} align="stretch" p={4}>
      <Text fontWeight="600" fontSize="sm">Filtrer par prix (FCFA)</Text>
      
      <RangeSlider
        aria-label={['prix min', 'prix max']}
        min={0}
        max={100000}
        step={1000}
        value={[localMinPrice, localMaxPrice]}
        onChange={handleSliderChange}
      >
        <RangeSliderTrack bg="gray.200">
          <RangeSliderFilledTrack bg="black" />
        </RangeSliderTrack>
        <RangeSliderThumb index={0} />
        <RangeSliderThumb index={1} />
      </RangeSlider>

      <HStack spacing={3}>
        <Box flex="1">
          <Text fontSize="sm" mb={1} fontWeight="500">Prix minimum</Text>
          <NumberInput
            size="sm"
            value={localMinPrice}
            onChange={(_, value) => setLocalMinPrice(isNaN(value) ? 0 : value)}
            min={0}
            max={localMaxPrice}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {formatPrice(localMinPrice)}
          </Text>
        </Box>
        <Box flex="1">
          <Text fontSize="sm" mb={1} fontWeight="500">Prix maximum</Text>
          <NumberInput
            size="sm"
            value={localMaxPrice}
            onChange={(_, value) => setLocalMaxPrice(isNaN(value) ? 100000 : value)}
            min={localMinPrice}
            max={100000}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {formatPrice(localMaxPrice)}
          </Text>
        </Box>
      </HStack>

      <Box bg="gray.100" p={3} borderRadius="md">
        <Text fontSize="sm" fontWeight="500" mb={1}>Plage sélectionnée :</Text>
        <Text fontSize="md" fontWeight="600" color="green.600">
          {formatPrice(localMinPrice)} - {formatPrice(localMaxPrice)}
        </Text>
      </Box>

      <HStack spacing={2} mt={2}>
        <Button size="sm" flex="1" onClick={handleApply} bg="black" color="white" _hover={{ bg: "gray.700" }}>
          Appliquer
        </Button>
        <Button size="sm" flex="1" variant="outline" onClick={handleReset}>
          Réinitialiser
        </Button>
      </HStack>
    </VStack>
  )
}

export default function Products() {
  const [products, setProducts] = React.useState<any[] | null>(null)
  const [categories, setCategories] = React.useState<any[] | null>(null)
  const [shopsMap, setShopsMap] = React.useState<Record<string, any>>({})
  const [categorizedProducts, setCategorizedProducts] = React.useState<Record<number, any[]>>({})
  const [query, setQuery] = React.useState('')
  const [allProducts, setAllProducts] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState(0)
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [sortBy, setSortBy] = React.useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default')
  const [minPrice, setMinPrice] = React.useState(0)
  const [maxPrice, setMaxPrice] = React.useState(1000000)
  const [isPriceFilterActive, setIsPriceFilterActive] = React.useState(false)
  const [isPinterestMode, setIsPinterestMode] = React.useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const cardBg = useColorModeValue('white', 'gray.800')
  const subtleBg = useColorModeValue('#f8f8f8', 'gray.700')
  const textPrimary = useColorModeValue('#111111', 'white')
  const textSecondary = useColorModeValue('#666666', 'gray.300')
  const accentColor = useColorModeValue('#111111', 'white')
  const hoverColor = useColorModeValue('#000000', 'gray.100')
  const badgeBg = useColorModeValue('#111111', 'gray.600')
  const badgeColor = useColorModeValue('white', 'white')
  const iconColor = useColorModeValue('#666666', 'gray.300')

  const gridColumns = useBreakpointValue({ 
    base: isPinterestMode ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)', 
    sm: isPinterestMode ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)', 
    md: isPinterestMode ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', 
    lg: isPinterestMode ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
    xl: isPinterestMode ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)'
  })

  const isMobile = useBreakpointValue({ base: true, md: false })

  // Fonction pour formater les prix en FCFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' FCFA'
  }

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [productsData, categoriesData, shopsData] = await Promise.all([
          api.products.list(),
          api.categories.list(),
          api.shops.list(),
        ])
        if (!mounted) return
        setProducts(productsData || [])
        setAllProducts(productsData || [])
        setCategories(categoriesData || [])

        const byId: Record<string, any> = {}
        const byOwner: Record<string, any> = {}
        ;(shopsData || []).forEach((s: any) => {
          if (s?.id) byId[String(s.id)] = s
          if (s?.owner_id) byOwner[String(s.owner_id)] = s
        })
        setShopsMap({ byId, byOwner })

        const map = {} as Record<number, any[]>
        ;(productsData || []).forEach((p: any) => {
          const cid = p.category_id ?? 0
          if (!map[cid]) map[cid] = []
          map[cid].push(p)
        })
        setCategorizedProducts(map)
      } catch (err) {
        console.error('Failed to load products', err)
        if (mounted) setProducts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Synchronise la query à partir du paramètre d'URL ?q=...
  const location = useLocation()
  const navigate = useNavigate()
  // Ensure Pinterest mode persists when encoded in the URL (e.g. ?view=pinterest)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const view = params.get('view')
      if (view) {
        const isP = view === 'pinterest'
        setIsPinterestMode(isP)
        try { localStorage.setItem('products:view', isP ? 'pinterest' : 'grid') } catch (e) {}
      } else {
        // no explicit view in url: try to restore from localStorage
        try {
          const stored = localStorage.getItem('products:view')
          if (stored === 'pinterest') setIsPinterestMode(true)
          else setIsPinterestMode(false)
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  }, [location.search])
  // If coming back from a ProductView we may have a focusProductId to scroll into view
  React.useEffect(() => {
    try {
      const state = (location && (location.state as any)) || {}
      // If the URL explicitly sets the view, prefer it and don't override; if no URL and no stored preference, we may use history state
      const params = new URLSearchParams(location.search)
      const view = params.get('view')
      const stored = (() => { try { return localStorage.getItem('products:view') } catch (e) { return null } })()
      const returnPinterest = state.isPinterestMode || (state.from && state.from.isPinterestMode)
      if (!view && !stored && typeof returnPinterest !== 'undefined' && returnPinterest) {
        setIsPinterestMode(true)
      }
      const focusId = state.focusProductId || (state.from && state.from.focusProductId) || null
      if (!focusId) return

      // Try to find the element and jump to it immediately (no smooth scroll)
      // If the element is not yet in the DOM, retry a few times quickly.
      let attempts = 0
      const maxAttempts = 10
      const tryScroll = () => {
        attempts += 1
        const el = document.getElementById(`product-${String(focusId)}`)
        if (el) {
            try {
            // immediate jump (also center inline for horizontal carousels)
            el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
            // ensure element receives focus so keyboard users land there
            try {
              el.setAttribute('tabindex', '-1')
              ;(el as HTMLElement).focus()
            } catch (e) {}
            // short visual highlight
            try {
              el.animate([
                { boxShadow: '0 0 0px rgba(0,0,0,0)' },
                { boxShadow: '0 0 14px rgba(0,150,136,0.28)' },
                { boxShadow: '0 0 0px rgba(0,0,0,0)' }
              ], { duration: 900 })
            } catch (e) {}
          } catch (e) {
            // ignore scroll errors
          }
        } else if (attempts < maxAttempts) {
          setTimeout(tryScroll, 60)
        }
      }

      // Start retries immediately
      tryScroll()
    } catch (e) {
      // ignore
    }
  }, [location])
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    // Ne pas écraser inutilement si identique
    if ((q || '') !== (query || '')) {
      setQuery(q)
    }
  }, [location.search])

  // Fonction de tri
  const sortProducts = (productsList: any[]) => {
    const sorted = [...productsList]
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => (a.price ?? a.amount ?? 0) - (b.price ?? b.amount ?? 0))
      case 'price-desc':
        return sorted.sort((a, b) => (b.price ?? b.amount ?? 0) - (a.price ?? b.amount ?? 0))
      case 'name':
        return sorted.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''))
      default:
        return sorted
    }
  }

  // Effet pour la recherche et le filtrage
  React.useEffect(() => {
    let filtered = allProducts || []

    // Appliquer la recherche
    if (query.trim()) {
      const terms = query.toLowerCase().trim().split(/\s+/)
      filtered = filtered.filter((p) => {
        const searchText = `${p.title || p.name || ''} ${p.description || ''}`.toLowerCase()
        return terms.every(term => searchText.includes(term))
      })
    }

    // Appliquer le filtre de catégorie
    if (selectedCategory !== null) {
      filtered = filtered.filter((p) => (p.category_id ?? 0) === selectedCategory)
    }

    // Appliquer le filtre de prix
    if (isPriceFilterActive) {
      filtered = filtered.filter((p) => {
        const price = p.price ?? p.amount ?? 0
        return price >= minPrice && price <= maxPrice
      })
    }

    // Appliquer le tri
    filtered = sortProducts(filtered)

    setProducts(filtered)

    // Reconstruire categorizedProducts pour les vues par catégorie
    const map = {} as Record<number, any[]>
    filtered.forEach((p: any) => {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    })
    setCategorizedProducts(map)
  }, [query, selectedCategory, sortBy, allProducts, minPrice, maxPrice, isPriceFilterActive])

  const popularProducts = React.useMemo(() => {
    return sortProducts(allProducts?.slice(0, 8) || [])
  }, [allProducts, sortBy])

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setActiveTab(0) // Retourner à l'onglet "Tous"
    if (isMobile) {
      onClose()
    }
  }

  const handlePriceChange = (newMinPrice: number, newMaxPrice: number) => {
    setMinPrice(newMinPrice)
    setMaxPrice(newMaxPrice)
  }

  const applyPriceFilter = () => {
    setIsPriceFilterActive(true)
  }

  const clearPriceFilter = () => {
    setMinPrice(0)
    setMaxPrice(100000)
    setIsPriceFilterActive(false)
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setQuery('')
    setSortBy('default')
    clearPriceFilter()
  }

  const togglePinterestMode = () => {
    try {
      const params = new URLSearchParams(location.search)
      const newVal = !isPinterestMode
      if (newVal) params.set('view', 'pinterest')
      else params.delete('view')
      const search = params.toString() ? `?${params.toString()}` : ''
      navigate({ pathname: location.pathname, search }, { replace: true })
      setIsPinterestMode(newVal)
      try { localStorage.setItem('products:view', newVal ? 'pinterest' : 'grid') } catch (e) {}
    } catch (e) {
      setIsPinterestMode(!isPinterestMode)
    }
  }

  if (loading) return (
    <Container maxW="container.xl" py={8}>
      <Center minH="60vh">
        <VStack spacing={6}>
          <Spinner 
            size="xl" 
            color={accentColor} 
            thickness="3px" 
            emptyColor={useColorModeValue('#f0f0f0','gray.700')}
          />
          <Text color={textSecondary} fontSize="lg" fontWeight="500">
            Chargement...
          </Text>
        </VStack>
      </Center>
    </Container>
  )

  const hasActiveFilters = selectedCategory !== null || query.trim() !== '' || sortBy !== 'default' || isPriceFilterActive

  return (
    <Container maxW="container.xl" py={4} pb={{ base: '120px', md: 8 }} px={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch" mb={8}>
        {/* Header avec bouton pour ouvrir la sidebar sur mobile */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading 
              size={{ base: "xl", md: "2xl" }}
              fontWeight="700" 
              color={textPrimary}
              letterSpacing="-0.5px"
              lineHeight="1.1"
            >
              Produits
            </Heading>
            <Text color={textSecondary} fontSize={{ base: "md", md: "lg" }} mt={2} fontWeight="400">
              Découvrez notre sélection exclusive
            </Text>
          </Box>
          
          <HStack spacing={2}>
            {/* Bouton Pinterest Mode */}
            <Tooltip label={isPinterestMode ? "Mode détaillé" : "Mode Pinterest"}>
              <IconButton
                aria-label={isPinterestMode ? "Mode détaillé" : "Mode Pinterest"}
                icon={isPinterestMode ? <ViewOffIcon /> : <ViewIcon />}
                size={isMobile ? "md" : "lg"}
                variant="outline"
                borderRadius="md"
                borderColor={borderColor}
                onClick={togglePinterestMode}
                _hover={{ bg: subtleBg }}
                color={isPinterestMode ? accentColor : textSecondary}
              />
            </Tooltip>
            
            {isMobile && (
              <IconButton
                aria-label="Ouvrir les filtres"
                icon={<FiMenu />}
                size="md"
                variant="outline"
                borderRadius="md"
                borderColor={borderColor}
                onClick={onOpen}
                _hover={{ bg: subtleBg }}
              />
            )}
          </HStack>
        </Flex>

        {/* Barre de filtres alignés sur une même ligne - Style Zara */}
        {!isMobile && (
          <Flex 
            gap={4} 
            align="center" 
            justify="flex-start"
            borderBottom="1px solid"
            borderColor={borderColor}
            pb={4}
            mb={6}
          >
            {/* Menu Trier par */}
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="outline"
                borderRadius="none"
                borderColor={borderColor}
                height="40px"
                px={6}
                fontWeight="500"
                fontSize="sm"
                _hover={{ borderColor: accentColor }}
                _active={{ bg: subtleBg }}
              >
                {sortBy === 'price-asc' && 'Prix croissant'}
                {sortBy === 'price-desc' && 'Prix décroissant'}
                {sortBy === 'name' && 'Nom A-Z'}
                {sortBy === 'default' && 'Trier par'}
              </MenuButton>
              <MenuList borderRadius="none" borderColor={borderColor}>
                <MenuItem 
                  onClick={() => setSortBy('default')} 
                  fontWeight={sortBy === 'default' ? '600' : '400'} 
                  icon={sortBy === 'default' ? <FiCheck /> : undefined}
                >
                  Par défaut
                </MenuItem>
                <MenuItem 
                  onClick={() => setSortBy('price-asc')} 
                  fontWeight={sortBy === 'price-asc' ? '600' : '400'} 
                  icon={sortBy === 'price-asc' ? <FiCheck /> : undefined}
                >
                  Prix croissant
                </MenuItem>
                <MenuItem 
                  onClick={() => setSortBy('price-desc')} 
                  fontWeight={sortBy === 'price-desc' ? '600' : '400'} 
                  icon={sortBy === 'price-desc' ? <FiCheck /> : undefined}
                >
                  Prix décroissant
                </MenuItem>
                <MenuItem 
                  onClick={() => setSortBy('name')} 
                  fontWeight={sortBy === 'name' ? '600' : '400'} 
                  icon={sortBy === 'name' ? <FiCheck /> : undefined}
                >
                  Nom A-Z
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Menu Catégories */}
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="outline"
                borderRadius="none"
                borderColor={borderColor}
                height="40px"
                px={6}
                fontWeight="500"
                fontSize="sm"
                _hover={{ borderColor: accentColor }}
                _active={{ bg: subtleBg }}
                leftIcon={<FiPackage />}
              >
                {selectedCategory !== null 
                  ? categories?.find(c => c.id === selectedCategory)?.name || 'Catégorie'
                  : 'Catégories'}
              </MenuButton>
              <MenuList 
                borderRadius="none" 
                borderColor={borderColor}
                maxH="400px"
                overflowY="auto"
              >
                <MenuItem 
                  onClick={() => handleCategorySelect(null)}
                  fontWeight={selectedCategory === null ? '600' : '400'}
                  bg={selectedCategory === null ? subtleBg : 'transparent'}
                >
                  Toutes les catégories
                  <Badge ml={2} colorScheme="black" variant="solid">
                    {allProducts?.length || 0}
                  </Badge>
                </MenuItem>
                <Divider />
                {categories?.filter(c => {
                  const allCatProducts = (allProducts || []).filter(p => (p.category_id ?? 0) === c.id)
                  return allCatProducts.length > 0
                }).map((c: any) => {
                  const allCatProducts = (allProducts || []).filter(p => (p.category_id ?? 0) === c.id)
                  return (
                    <MenuItem 
                      key={c.id}
                      onClick={() => handleCategorySelect(c.id)}
                      fontWeight={selectedCategory === c.id ? '600' : '400'}
                      bg={selectedCategory === c.id ? subtleBg : 'transparent'}
                    >
                      {c.name}
                      <Badge ml={2} colorScheme="black" variant="solid">
                        {allCatProducts.length}
                      </Badge>
                    </MenuItem>
                  )
                })}
              </MenuList>
            </Menu>

            {/* Filtre de prix */}
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  borderRadius="none"
                  borderColor={borderColor}
                  height="40px"
                  px={6}
                  fontWeight="500"
                  fontSize="sm"
                  _hover={{ borderColor: accentColor }}
                  _active={{ bg: subtleBg }}
                  bg={isPriceFilterActive ? accentColor : 'transparent'}
                  color={isPriceFilterActive ? 'white' : textPrimary}
                >
                  Prix
                  {isPriceFilterActive && (
                    <Badge ml={2} variant="solid" colorScheme="white" color="black">
                      {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent borderRadius="none" borderColor={borderColor}>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="600" borderBottom="1px solid" borderColor={borderColor}>
                  Filtrer par prix (FCFA)
                </PopoverHeader>
                <PopoverBody p={0}>
                  <PriceFilter
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onPriceChange={handlePriceChange}
                    onApplyPriceFilter={applyPriceFilter}
                  />
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>
        )}

        {/* Filtres actifs */}
        {hasActiveFilters && (
          <Card bg={subtleBg} borderRadius="none" border="1px solid" borderColor={borderColor}>
            <CardBody py={3} px={4}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                <HStack spacing={2} wrap="wrap">
                  <Text color={textSecondary} fontSize="sm" fontWeight="500">
                    Filtres actifs:
                  </Text>
                  {selectedCategory !== null && (
                    <Badge 
                      bg={badgeBg}
                      color={badgeColor}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontWeight="500"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      {categories?.find(c => c.id === selectedCategory)?.name || 'Catégorie'}
                      <IconButton
                        aria-label="Supprimer filtre"
                        icon={<CloseIcon boxSize={2} />}
                        size="xs"
                        variant="unstyled"
                        minW="auto"
                        h="auto"
                        onClick={() => setSelectedCategory(null)}
                        _hover={{ transform: 'scale(1.2)' }}
                      />
                    </Badge>
                  )}
                  {query && (
                    <Badge 
                      bg={badgeBg}
                      color={badgeColor}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontWeight="500"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      "{query}"
                      <IconButton
                        aria-label="Supprimer recherche"
                        icon={<CloseIcon boxSize={2} />}
                        size="xs"
                        variant="unstyled"
                        minW="auto"
                        h="auto"
                        onClick={() => setQuery('')}
                        _hover={{ transform: 'scale(1.2)' }}
                      />
                    </Badge>
                  )}
                  {isPriceFilterActive && (
                    <Badge 
                      bg={badgeBg}
                      color={badgeColor}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontWeight="500"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                      <IconButton
                        aria-label="Supprimer filtre prix"
                        icon={<CloseIcon boxSize={2} />}
                        size="xs"
                        variant="unstyled"
                        minW="auto"
                        h="auto"
                        onClick={clearPriceFilter}
                        _hover={{ transform: 'scale(1.2)' }}
                      />
                    </Badge>
                  )}
                  {sortBy !== 'default' && (
                    <Badge 
                      bg={badgeBg}
                      color={badgeColor}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontWeight="500"
                    >
                      {sortBy === 'price-asc' && 'Prix ↑'}
                      {sortBy === 'price-desc' && 'Prix ↓'}
                      {sortBy === 'name' && 'Nom A-Z'}
                    </Badge>
                  )}
                </HStack>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  fontWeight="500"
                  borderRadius="none"
                  _hover={{ bg: 'transparent', color: accentColor }}
                >
                  Tout effacer
                </Button>
              </Flex>
            </CardBody>
          </Card>
        )}

        {/* Compteur de résultats */}
        <Flex justify="space-between" align="center">
          <Text color={textSecondary} fontSize="md" fontWeight="500">
            {products?.length || 0} produit{(products?.length || 0) > 1 ? 's' : ''} {hasActiveFilters ? 'trouvé' + ((products?.length || 0) > 1 ? 's' : '') : ''}
          </Text>
          {!isMobile && (
            <Text color={textSecondary} fontSize="sm" fontWeight="500">
              Mode: {isPinterestMode ? 'Pinterest' : 'Détaillé'}
            </Text>
          )}
        </Flex>
      </VStack>

      {/* Navigation desktop */}
      {!isMobile && !hasActiveFilters && (
        <Tabs 
          variant="unstyled" 
          mb={10}
          index={activeTab}
          onChange={setActiveTab}
        >
          <TabList 
            borderBottom="1px solid" 
            borderColor={borderColor}
            gap={8}
          >
            <Tab 
              fontWeight="500" 
              color={textSecondary}
              _selected={{ 
                color: textPrimary, 
                fontWeight: "600",
                borderBottom: "2px solid",
                borderColor: accentColor
              }}
              py={4}
              px={0}
              fontSize="lg"
              letterSpacing="0.3px"
            >
              <HStack spacing={3}>
                <Icon as={FiGrid} boxSize={5} />
                <Text>Tous les produits</Text>
              </HStack>
            </Tab>
            <Tab 
              fontWeight="500" 
              color={textSecondary}
              _selected={{ 
                color: textPrimary, 
                fontWeight: "600",
                borderBottom: "2px solid",
                borderColor: accentColor
              }}
              py={4}
              px={0}
              fontSize="lg"
              letterSpacing="0.3px"
            >
              <HStack spacing={3}>
                <Text>Populaires</Text>
              </HStack>
            </Tab>
            <Tab 
              fontWeight="500" 
              color={textSecondary}
              _selected={{ 
                color: textPrimary, 
                fontWeight: "600",
                borderBottom: "2px solid",
                borderColor: accentColor
              }}
              py={4}
              px={0}
              fontSize="lg"
              letterSpacing="0.3px"
            >
              <HStack spacing={3}>
                <Icon as={FiTrendingUp} boxSize={5} />
                <Text>Nouveautés</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0} pt={8}>
              {renderAllProducts()}
            </TabPanel>
            <TabPanel px={0} pt={8}>
              {renderPopularProducts()}
            </TabPanel>
            <TabPanel px={0} pt={8}>
              {renderNewProducts()}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {/* Navigation mobile */}
      {isMobile && !hasActiveFilters && (
        <Box>
          <SimpleGrid columns={3} spacing={3} mb={8}>
            <Button
              variant={activeTab === 0 ? "solid" : "outline"}
              size="md"
              borderRadius="none"
              bg={activeTab === 0 ? accentColor : "transparent"}
              color={activeTab === 0 ? "white" : textSecondary}
              borderColor={activeTab === 0 ? accentColor : borderColor}
              borderWidth="1.5px"
              fontWeight="500"
              onClick={() => setActiveTab(0)}
              _hover={{
                bg: activeTab === 0 ? hoverColor : subtleBg,
                borderColor: activeTab === 0 ? hoverColor : accentColor
              }}
            >
              Tous
            </Button>
            <Button
              variant={activeTab === 1 ? "solid" : "outline"}
              size="md"
              borderRadius="none"
              bg={activeTab === 1 ? accentColor : "transparent"}
              color={activeTab === 1 ? "white" : textSecondary}
              borderColor={activeTab === 1 ? accentColor : borderColor}
              borderWidth="1.5px"
              fontWeight="500"
              onClick={() => setActiveTab(1)}
              _hover={{
                bg: activeTab === 1 ? hoverColor : subtleBg,
                borderColor: activeTab === 1 ? hoverColor : accentColor
              }}
            >
              Populaires
            </Button>
            <Button
              variant={activeTab === 2 ? "solid" : "outline"}
              size="md"
              borderRadius="none"
              bg={activeTab === 2 ? accentColor : "transparent"}
              color={activeTab === 2 ? "white" : textSecondary}
              borderColor={activeTab === 2 ? accentColor : borderColor}
              borderWidth="1.5px"
              fontWeight="500"
              onClick={() => setActiveTab(2)}
              _hover={{
                bg: activeTab === 2 ? hoverColor : subtleBg,
                borderColor: activeTab === 2 ? hoverColor : accentColor
              }}
            >
              Nouveautés
            </Button>
          </SimpleGrid>

          {activeTab === 0 && renderAllProducts()}
          {activeTab === 1 && renderPopularProducts()}
          {activeTab === 2 && renderNewProducts()}
        </Box>
      )}

      {/* Affichage des résultats filtrés */}
      {hasActiveFilters && renderFilteredProducts()}

      {/* Drawer catégories mobile */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent borderRadius="none">
          <DrawerCloseButton size="lg" mt={2} mr={2} />
          <DrawerHeader 
            borderBottomWidth="1px" 
            borderColor={borderColor}
            fontSize="xl"
            fontWeight="600"
            py={6}
          >
            Filtres
          </DrawerHeader>
          <DrawerBody py={6} px={4}>
            <VStack align="stretch" spacing={6}>
              {/* Filtre de prix mobile */}
              <Box>
                <Text fontWeight="600" mb={4} fontSize="lg">Prix (FCFA)</Text>
                <PriceFilter
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onPriceChange={handlePriceChange}
                  onApplyPriceFilter={applyPriceFilter}
                />
              </Box>

              <Divider />

              {/* Catégories mobile */}
              <Box>
                <Text fontWeight="600" mb={4} fontSize="lg">Catégories</Text>
                <VStack align="stretch" spacing={1}>
                  <Button
                    variant={selectedCategory === null ? "solid" : "ghost"}
                    justifyContent="start"
                    borderRadius="none"
                    py={4}
                    bg={selectedCategory === null ? accentColor : "transparent"}
                    color={selectedCategory === null ? "white" : textPrimary}
                    fontWeight="500"
                    onClick={() => handleCategorySelect(null)}
                    _hover={{
                      bg: selectedCategory === null ? hoverColor : subtleBg
                    }}
                  >
                    Toutes les catégories
                    <Badge ml="auto" bg={selectedCategory === null ? "white" : badgeBg} color={selectedCategory === null ? accentColor : badgeColor}>
                      {allProducts?.length || 0}
                    </Badge>
                  </Button>
                  <Divider my={2} />
                  {categories?.filter(c => {
                    const allCatProducts = (allProducts || []).filter(p => (p.category_id ?? 0) === c.id)
                    return allCatProducts.length > 0
                  }).map((c: any) => {
                    const allCatProducts = (allProducts || []).filter(p => (p.category_id ?? 0) === c.id)
                    return (
                      <Button
                        key={c.id}
                        variant={selectedCategory === c.id ? "solid" : "ghost"}
                        justifyContent="space-between"
                        borderRadius="none"
                        py={4}
                        bg={selectedCategory === c.id ? accentColor : "transparent"}
                        color={selectedCategory === c.id ? "white" : textPrimary}
                        fontWeight="500"
                        onClick={() => handleCategorySelect(c.id)}
                        _hover={{
                          bg: selectedCategory === c.id ? hoverColor : subtleBg
                        }}
                      >
                        <Text>{c.name}</Text>
                        <Badge 
                          bg={selectedCategory === c.id ? "white" : badgeBg} 
                          color={selectedCategory === c.id ? accentColor : badgeColor}
                          fontSize="xs"
                          px={2}
                          py={1}
                          borderRadius="none"
                          fontWeight="600"
                        >
                          {allCatProducts.length}
                        </Badge>
                      </Button>
                    )
                  })}
                </VStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <ScrollTopButton />
    </Container>
  )

  function renderFilteredProducts() {
    if (!products || products.length === 0) {
      return (
        <Center py={20} minH="50vh">
          <VStack spacing={6}>
            <Icon as={FiPackage} boxSize={16} color={iconColor} />
            <Text color={textPrimary} fontSize="xl" fontWeight="600" textAlign="center">
              Aucun produit trouvé
            </Text>
            <Text color={textSecondary} fontSize="md" textAlign="center" maxW="400px" lineHeight="1.6">
              Essayez de modifier vos filtres ou votre recherche
            </Text>
            <Button
              variant="outline"
              borderRadius="none"
              borderColor={accentColor}
              color={accentColor}
              fontWeight="500"
              size="lg"
              _hover={{ bg: accentColor, color: 'white' }}
              mt={4}
              onClick={clearFilters}
            >
              Effacer les filtres
            </Button>
          </VStack>
        </Center>
      )
    }

    if (isPinterestMode) {
      return (
        <Box className="pinterest-grid">
          <SimpleGrid 
            columns={{ base: 2, sm: 2, md: 3, lg: 4 }} 
            spacing={{ base: 3, md: 4 }}
            style={{ gridAutoRows: 'auto' }}
          >
            {products.map((p) => {
              const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
              return (
                <PinterestProductCard
                  key={p.id}
                  product={p}
                  shop={shop}
                />
              )
            })}
          </SimpleGrid>
        </Box>
      )
    }

    return (
      <Grid templateColumns={gridColumns} gap={{ base: 4, md: 6 }}>
        {products.map((p) => {
          const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
          return (
            <ProductCard
              key={p.id}
              id={String(p.id)}
              title={p.title || p.name}
              price={p.price ?? p.amount}
              originalPrice={p.original_price ?? p.price ?? p.amount}
              discount={p.discount ?? 0}
              description={p.description}
              image_url={p.image_url ?? p.product_image}
              images={p.images}
              quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
              shopId={shop?.id || p.shop_id || p.seller_id}
              shopName={shop?.name}
              shopDomain={shop?.domain}
              height={{ base: '320px', md: '380px' }}
                      isPinterestMode={isPinterestMode}
            />
          )
        })}
      </Grid>
    )
  }

  function renderAllProducts() {
    if (isPinterestMode) {
      return (
        <Box className="pinterest-grid">
          <SimpleGrid 
            columns={{ base: 2, sm: 2, md: 3, lg: 4 }} 
            spacing={{ base: 3, md: 4 }}
            style={{ gridAutoRows: 'auto' }}
          >
            {products?.map((p) => {
              const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
              return (
                <PinterestProductCard
                  key={p.id}
                  product={p}
                  shop={shop}
                />
              )
            })}
          </SimpleGrid>
        </Box>
      )
    }

    return (
      <>
        {/* Produits sans catégorie */}
        {(categorizedProducts[0] || []).length > 0 && (
          <Box mb={12}>
            {!isMobile && (categorizedProducts[0] || []).length > 4 ? (
              <ProductsCarousel 
                products={categorizedProducts[0] || []}
                title="Découvertes"
                shopsMap={shopsMap}
                isPinterestMode={isPinterestMode}
              />
            ) : (
              <>
                <HStack spacing={4} mb={6} align="center">
                  <Box w="4px" h="24px" bg={accentColor} borderRadius="none" />
                  <VStack align="start" spacing={1}>
                    <Heading size={{ base: "md", md: "xl" }} fontWeight="700" color={textPrimary} letterSpacing="-0.5px">
                      Découvertes
                    </Heading>
                    <Text color={textSecondary} fontSize={{ base: "sm", md: "md" }} fontWeight="400">
                      {(categorizedProducts[0] || []).length} produit{(categorizedProducts[0] || []).length > 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </HStack>

                <Grid templateColumns={gridColumns} gap={{ base: 4, md: 6 }}>
                  {(categorizedProducts[0] || []).map((p) => {
                    const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                    return (
                      <ProductCard 
                        key={p.id} 
                        id={String(p.id)} 
                        title={p.title || p.name} 
                        price={p.price ?? p.amount}
                        originalPrice={p.original_price ?? p.price ?? p.amount}
                        discount={p.discount ?? 0}
                        description={p.description} 
                        image_url={p.image_url ?? p.product_image} 
                        images={p.images}
                        quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                        shopId={shop?.id || p.shop_id || p.seller_id}
                        shopName={shop?.name}
                        shopDomain={shop?.domain}
                        height={{ base: '320px', md: '380px' }}
                      />
                    )
                  })}
                </Grid>
              </>
            )}
          </Box>
        )}

        {/* Produits par catégorie */}
        {categories && categories.length > 0 && (
          <VStack spacing={12} align="stretch">
            {categories
              .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
              .map((c: any) => (
                <Box key={c.id} id={`category-${c.id}`}>
                  {!isMobile && (categorizedProducts[c.id] || []).length > 4 ? (
                    <ProductsCarousel 
                      products={categorizedProducts[c.id] || []}
                      title={c.name}
                      shopsMap={shopsMap}
                      isPinterestMode={isPinterestMode}
                    />
                  ) : (
                    <>
                      <HStack spacing={4} mb={6} align="center">
                        <Box w="4px" h="28px" bg={accentColor} borderRadius="none" />
                        <VStack align="start" spacing={1}>
                          <Heading size={{ base: "lg", md: "2xl" }} fontWeight="700" color={textPrimary} letterSpacing="-0.5px">
                            {c.name}
                          </Heading>
                          <Text color={textSecondary} fontSize={{ base: "sm", md: "lg" }} fontWeight="400">
                            {(categorizedProducts[c.id] || []).length} produit{(categorizedProducts[c.id] || []).length > 1 ? 's' : ''}
                          </Text>
                        </VStack>
                      </HStack>

                      <Grid templateColumns={gridColumns} gap={{ base: 4, md: 6 }}>
                        {(categorizedProducts[c.id] || []).map((p) => {
                          const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                          return (
                            <ProductCard
                              key={p.id}
                              id={String(p.id)}
                              title={p.title || p.name}
                              price={p.price ?? p.amount}
                              originalPrice={p.original_price ?? p.price ?? p.amount}
                              discount={p.discount ?? 0}
                              description={p.description}
                              image_url={p.image_url ?? p.product_image}
                              images={p.images}
                              quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                              shopId={shop?.id || p.shop_id || p.seller_id}
                              shopName={shop?.name}
                              shopDomain={shop?.domain}
                              height={{ base: '320px', md: '380px' }}
                              isPinterestMode={isPinterestMode}
                            />
                          )
                        })}
                      </Grid>
                    </>
                  )}
                </Box>
              ))}
          </VStack>
        )}
      </>
    )
  }

  function renderPopularProducts() {
    if (popularProducts.length === 0) {
      return (
        <Center py={20} minH="50vh">
          <VStack spacing={6}>
            <Icon as={StarIcon} boxSize={16} color={iconColor} />
            <Text color={textPrimary} fontSize="xl" fontWeight="600" textAlign="center">
              Aucun produit populaire
            </Text>
          </VStack>
        </Center>
      )
    }

    if (isPinterestMode) {
      return (
        <Box className="pinterest-grid">
          <SimpleGrid 
            columns={{ base: 2, sm: 2, md: 3, lg: 4 }} 
            spacing={{ base: 3, md: 4 }}
            style={{ gridAutoRows: 'auto' }}
          >
            {popularProducts.map((p) => {
              const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
              return (
                <PinterestProductCard
                  key={p.id}
                  product={p}
                  shop={shop}
                />
              )
            })}
          </SimpleGrid>
        </Box>
      )
    }

    return (
      <Grid templateColumns={gridColumns} gap={{ base: 4, md: 6 }}>
        {popularProducts.map((p) => {
          const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
          return (
            <ProductCard
              key={p.id}
              id={String(p.id)}
              title={p.title || p.name}
              price={p.price ?? p.amount}
              originalPrice={p.original_price ?? p.price ?? p.amount}
              discount={p.discount ?? 0}
              description={p.description}
              image_url={p.image_url ?? p.product_image}
              images={p.images}
              quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
              shopId={shop?.id || p.shop_id || p.seller_id}
              shopName={shop?.name}
              shopDomain={shop?.domain}
              height={{ base: '320px', md: '380px' }}
              isPinterestMode={isPinterestMode}
            />
          )
        })}
      </Grid>
    )
  }

  function renderNewProducts() {
    return (
      <Center py={20} minH="50vh">
        <VStack spacing={6}>
          <Icon as={FiTrendingUp} boxSize={16} color={iconColor} />
          <Text color={textPrimary} fontSize="xl" fontWeight="600" textAlign="center">
            Nouveautés à venir
          </Text>
          <Text color={textSecondary} fontSize="md" textAlign="center" maxW="400px" lineHeight="1.6">
            Restez à l'affût pour découvrir nos prochaines collections exclusives
          </Text>
          <Button
            variant="outline"
            borderRadius="none"
            borderColor={accentColor}
            color={accentColor}
            fontWeight="500"
            size="lg"
            _hover={{ bg: accentColor, color: 'white' }}
            mt={4}
          >
            Me notifier
          </Button>
        </VStack>
      </Center>
    )
  }
}