import React from 'react'
import {
  Heading,
  Text,
  Container,
  Button,
  Spinner,
  VStack,
  Box,
  Center,
  Grid,
  GridItem,
  useBreakpointValue,
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
  Fade,
  ScaleFade,
  SimpleGrid,
} from '@chakra-ui/react'
import { CloseIcon, StarIcon } from '@chakra-ui/icons'
import FilterNav from '../components/FilterNav'
import AppTutorial from '../components/AppTutorial'
import ShopCard from '../components/ShopCard'
import ProductCard from '../components/ProductCard'
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
  [key: string]: string | number | null | undefined
}

interface Category {
  id: number
  name: string
}

interface Shop {
  id: number
  name: string
}

// Composant Carousel GPU optimisé avec pause au clic
const SmoothCarousel: React.FC<{ 
  children: React.ReactNode; 
  speed?: number;
}> = ({ children, speed = 40 }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = React.useState(false)
  const pauseTimeoutRef = React.useRef<number | null>(null)
  const isPausedRef = React.useRef<boolean>(isPaused)
  // interaction and measurement refs
  const isInteractingRef = React.useRef(false)
  const startXRef = React.useRef<number | null>(null)
  const startPosRef = React.useRef<number>(0)
  const positionRef = React.useRef<number>(0)
  const contentWidthRef = React.useRef<number>(0)
  const resumeTimerRef = React.useRef<number | null>(null)
  
  // keep a ref in sync so the animation loop doesn't need to re-subscribe on pause changes
  React.useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  React.useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    let animationId: number
    let lastTime: number | null = null
    // ensure positionRef initial value
    positionRef.current = positionRef.current || 0
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    const adjustedSpeed = isMobile ? speed * 1 : speed

    // measure content width (one copy)
    const measure = () => {
      try {
        const w = Math.max(1, content.scrollWidth / 2)
        contentWidthRef.current = w
      } catch (e) {
        contentWidthRef.current = 0
      }
    }
    measure()
    let ro: ResizeObserver | null = null
    try {
      ro = new ResizeObserver(() => measure())
      ro.observe(content)
    } catch (e) {
      ro = null
    }

    const animate = (currentTime: number) => {
      if (!lastTime) lastTime = currentTime
      const deltaTime = Math.min(currentTime - lastTime, 40)
      lastTime = currentTime
      // read paused state from ref to avoid re-creating the animation loop on pause toggles
      if (!isPausedRef.current && !isInteractingRef.current && contentWidthRef.current > 0) {
        positionRef.current += (deltaTime * adjustedSpeed) / 1000 
        const contentWidth = contentWidthRef.current
        if (positionRef.current >= contentWidth) positionRef.current -= contentWidth
        content.style.transform = `translate3d(${-positionRef.current}px, 0, 0)`
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      // clear timers on unmount
      if (pauseTimeoutRef.current) window.clearTimeout(pauseTimeoutRef.current)
      if (resumeTimerRef.current) { window.clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
      if (ro) try { ro.disconnect() } catch (e) { /* ignore */ }
    }
  }, [speed])

  // Gestion de la pause temporaire au clic
  const handleClick = () => {
    setIsPaused(true)
    
    // Clear any existing timeout
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current)
    }
    
    // Reprendre automatiquement après 2 secondes
    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false)
    }, 2000)
  }

  // Pause au survol (optionnel - pour plus de contrôle)
  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    // resume only if not interacting
    if (!isInteractingRef.current) setIsPaused(false)
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
  }

  // Pointer handlers for swipe/drag (user interaction overrides auto-scroll)
  const onPointerDown = (e: React.PointerEvent) => {
    const clientX = (e as React.PointerEvent).clientX
    isInteractingRef.current = true
    startXRef.current = clientX
    startPosRef.current = positionRef.current
    // ensure auto-scroll is paused immediately when user starts interacting
    setIsPaused(true)
    isPausedRef.current = true
    // capture pointer to receive move/up even if cursor leaves element
    try { (e.target as Element).setPointerCapture((e as any).pointerId) } catch (err) { /* ignore */ }
    // cancel any scheduled resume
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteractingRef.current) return
    const clientX = (e as React.PointerEvent).clientX
    if (startXRef.current == null) { startXRef.current = clientX; return }
    const dx = clientX - startXRef.current
    const newPos = startPosRef.current - dx
    const w = contentWidthRef.current || (contentRef.current ? contentRef.current.scrollWidth / 2 : 0)
    if (w > 0) {
      let norm = ((newPos % w) + w) % w
      positionRef.current = norm
    } else {
      positionRef.current = newPos
    }
    if (contentRef.current) contentRef.current.style.transform = `translate3d(${-positionRef.current}px,0,0)`
  }

  const onPointerUp = (e: React.PointerEvent) => {
    isInteractingRef.current = false
    startXRef.current = null
    // resume automatic after short delay to allow user to see result
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null
      setIsPaused(false)
    }, 1200)
    try { (e.target as Element).releasePointerCapture((e as any).pointerId) } catch (err) { /* ignore */ }
  }

  return (
    <Box 
      ref={containerRef}
      overflow="hidden"
      position="relative"
      sx={{
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        ref={contentRef}
        display="flex"
        willChange="transform"
        style={{ 
          transform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          perspective: 1000
        }}
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        cursor="pointer"
        userSelect="none"
        css={{
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        {children}
        {children} {/* Duplication pour l'effet infini */}
      </Box>
      
      {/* Indicateur visuel de pause */}
      {isPaused && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="blackAlpha.600"
          color="white"
          px={3}
          py={1}
          borderRadius="md"
          fontSize="sm"
          opacity={0}
          animation="fadeInOut 2s ease-in-out"
          css={{
            '@keyframes fadeInOut': {
              '0%': { opacity: 0 },
              '20%': { opacity: 1 },
              '80%': { opacity: 1 },
              '100%': { opacity: 0 }
            }
          }}
        >
          Reprise dans 2s...
        </Box>
      )}
    </Box>
  )
}

export default function Home() {
  const [shops, setShops] = React.useState<Shop[]>([])
  const [shopsMap, setShopsMap] = React.useState<Record<string, any>>({})
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [categorizedProducts, setCategorizedProducts] = React.useState<Record<number, Product[]>>({})
  const [currentView, setCurrentView] = React.useState<'shops' | 'products'>('products')
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Déplacer tous les hooks conditionnels en haut
  const cardHeight = useBreakpointValue({ base: '120px', md: '200px' })
  const cardWidth = useBreakpointValue({ base: '45%', sm: '45%', md: '180px' })
  const initialCount = useBreakpointValue({ base: 4, md: 6 }) || 6
  
  // Tous les useColorModeValue doivent être déclarés au même niveau
  const bgGradient = useColorModeValue(
    'linear(to-br, brand.500, brand.600)',
    'linear(to-br, brand.600, brand.700)'
  )
  const sectionBg = useColorModeValue('brand.200', 'gray.800')
  const categoryBg = useColorModeValue('brand.50', 'brand.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const secondaryTextColor = useColorModeValue('black', 'brand.500')

  // Pagination / lazy loading UX
  const loadMoreCount = 6
  const [visibleByCategory, setVisibleByCategory] = React.useState<Record<number, number>>({})
  const [visibleUncategorized, setVisibleUncategorized] = React.useState<number>(initialCount)

  React.useEffect(() => {
    async function loadData() {
      try {
        const [shopsData, categoriesData, productsData] = await Promise.all([
          api.shops.list(),
          api.categories.list(),
          api.products.list(),
        ])
        
        setShops(shopsData)
        // build shops lookup maps for quick access by id or owner
        const byId: Record<string, any> = {}
        const byOwner: Record<string, any> = {}
        ;(shopsData || []).forEach((s: any) => {
          if (s?.id) byId[String(s.id)] = s
          if (s?.owner_id) byOwner[String(s.owner_id)] = s
        })
        setShopsMap({ byId, byOwner })
        setCategories(categoriesData)
        setProducts(productsData)
        
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

  const handleSearch = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Reset to initial data
      const productsData = await api.products.list()
      setProducts(productsData?.slice(0, 12) || [])
      return
    }

    setIsLoading(true)
    try {
      if (currentView === 'products') {
        // search products
        const allProducts = await api.products.list()
        const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

        const filteredProducts = allProducts?.filter((product: Product) => {
          const searchText = `${product.title || product.name || ''} ${product.description || ''}`.toLowerCase()
          return searchTerms.every(term => searchText.includes(term))
        }) || []
        setProducts(filteredProducts)
      } else {
        // search shops
        const results = await api.shops.search(searchQuery.trim())
        setShops(results)
      }
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentView])

  // Export search function to make it available to NavBar
  React.useEffect(() => {
    // @ts-ignore - Global type declared in src/types/global.d.ts
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
    // Reset visible counts when product list changes (fresh search/filter)
    setVisibleByCategory({})
    setVisibleUncategorized(initialCount)
  }, [products, initialCount])

  // Reload data when the view changes (shops <-> products)
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
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
          spacing={{ base: 3, md: 4 }}
          px={{ base: 2, md: 0 }}
        >
          {shops.map((shop, index) => (
            <Box 
              key={shop.id} 
              transition="all 0.3s ease"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <ShopCard 
                {...shop} 
                id={String(shop.id)} 
                compact 
                height={cardHeight}
              />
            </Box>
          ))}
        </SimpleGrid>
      </ScaleFade>
    )
  }

  const renderProductsView = () => {
    if (!products?.length) {
      return <NoResults message="Aucun produit trouvé" onClear={() => handleSearch('')} />
    }

    return (
      <VStack spacing={8} align="stretch">
        {/* Nouveautés carousel horizontal optimisé */}
        {(() => {
          const newProducts = [...(products || [])]
            .sort((a, b) => {
              const ta = a.created_at ? new Date(String(a.created_at)).getTime() : 0
              const tb = b.created_at ? new Date(String(b.created_at)).getTime() : 0
              return tb - ta
            })
            .slice(0, 12)
          if (!newProducts.length) return null

          return (
            <Box mb={6}>
              <Heading size="md" color="black">Nouveautés</Heading>
              <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                🤍
              </Text>

              <SmoothCarousel speed={70}>
                {newProducts.map((product) => (
                  <Box
                    key={product.id}
                    flex="0 0 auto"
                    w={cardWidth}
                    px={1.5}
                  >
                    <ProductCard
                      id={String(product.id)}
                      title={product.title || product.name || ''}
                      price={product.price ?? product.amount}
                      image_url={product.image_url ?? product.product_image}
                      height={cardHeight}
                      shopName={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]))?.name}
                      shopDomain={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]))?.domain}
                    />
                  </Box>
                ))}
              </SmoothCarousel>
            </Box>
          )
        })()}
        
        {selectedCategory === null ? (
          <Fade in={!isLoading}>
            <VStack spacing={8}>
              {renderUncategorizedProducts()}
              {categories
                .filter(category => (categorizedProducts[category.id] || []).length > 0)
                .map((category, index) => (
                  <Box key={category.id} style={{ animationDelay: `${index * 100}ms` }}>
                    {renderProductCategory(category)}
                  </Box>
                ))}
            </VStack>
          </Fade>
        ) : (
          <ScaleFade in={!isLoading}>
            <SimpleGrid 
              columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
              spacing={3}
              px={{ base: 2, md: 0 }}
            >
              {(categorizedProducts[selectedCategory] || []).map((product) => (
                <Box 
                  key={product.id}
                  transition="all 0.3s ease"
                  _hover={{ transform: 'translateY(-2px)' }}
                >
                  <ProductCard
                    id={String(product.id)}
                    title={product.title || product.name || ''}
                    price={product.price ?? product.amount}
                    image_url={product.image_url ?? product.product_image}
                    height={cardHeight}
                    shopName={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]))?.name}
                    shopDomain={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]))?.domain}
                  />
                </Box>
              ))}
            </SimpleGrid>
          </ScaleFade>
        )}
      </VStack>
    )
  }

  const renderUncategorizedProducts = () => {
    const uncategorizedProducts = products?.filter(product => !product.category_id) || []
    if (uncategorizedProducts.length === 0) return null
    const visible = visibleUncategorized || initialCount
    const toShow = uncategorizedProducts.slice(0, visible)

    return (
      <Box 
        mb={8} 
        bg={categoryBg}
        p={{ base: 4, md: 6 }} 
        borderRadius="xl" 
        border="1px solid"
        borderColor="brand.100"
        boxShadow="sm"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={-2}
          right={-2}
          bg="brand.500"
          borderRadius="full"
          p={2}
          boxShadow="md"
        >
          <StarIcon color="white" boxSize={3} />
        </Box>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="md" color={textColor}>Découvertes</Heading>
            <Badge colorScheme="brand" variant="subtle" fontSize="sm">
              {uncategorizedProducts.length} produit(s)
            </Badge>
          </HStack>
          <SimpleGrid 
            columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
            spacing={3}
          >
            {toShow.map((product) => {
              const shop = (shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)])
              return (
                <Box 
                  key={product.id}
                  transition="all 0.3s ease"
                  _hover={{ transform: 'translateY(-2px)' }}
                >
                  <ProductCard
                    id={String(product.id)}
                    title={product.title || product.name || ''}
                    price={product.price ?? product.amount}
                    image_url={product.image_url ?? product.product_image}
                    height={cardHeight}
                    shopName={shop?.name}
                    shopDomain={shop?.domain}
                  />
                </Box>
              )
            })}
          </SimpleGrid>

          {uncategorizedProducts.length > toShow.length && (
            <Center>
              <Button size="sm" onClick={() => setVisibleUncategorized(v => v + loadMoreCount)}>Voir plus</Button>
            </Center>
          )}
        </VStack>
      </Box>
    )
  }

  const renderProductCategory = (category: Category) => {
    const categoryProducts = categorizedProducts[category.id] || []
    if (categoryProducts.length === 0) return null
    const visible = visibleByCategory[category.id] ?? initialCount
    const toShow = categoryProducts.slice(0, visible)

    return (
      <Box 
        key={category.id} 
        bg={sectionBg}
        p={{ base: 4, md: 6 }} 
        borderRadius="xl" 
        mb={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
        transition="all 0.3s ease"
        _hover={{
          boxShadow: 'md',
          borderColor: 'brand.300'
        }}
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="lg" color={textColor}>{category.name}</Heading>
            <Badge colorScheme="brand" fontSize="sm" px={2} py={1} borderRadius="full">
              {categoryProducts.length} article(s)
            </Badge>
          </HStack>
          <SimpleGrid 
            columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
            spacing={3}
          >
            {toShow.map((product) => {
              const shop = (shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)])
              return (
                <Box 
                  key={product.id}
                  transition="all 0.3s ease"
                  _hover={{ transform: 'translateY(-2px)' }}
                >
                  <ProductCard
                    id={String(product.id)}
                    title={product.title || product.name || ''}
                    price={product.price ?? product.amount}
                    image_url={product.image_url ?? product.product_image}
                    height={cardHeight}
                    shopName={shop?.name}
                    shopDomain={shop?.domain}
                  />
                </Box>
              )
            })}
          </SimpleGrid>

          {categoryProducts.length > toShow.length && (
            <Center>
              <Button size="sm" onClick={() => setVisibleByCategory(prev => ({ ...prev, [category.id]: (prev[category.id] || initialCount) + loadMoreCount }))}>Voir plus</Button>
            </Center>
          )}
        </VStack>
      </Box>
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

      <Container maxW={{ base: '100%', lg: '90%', xl: '85%' }} py={8} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" thickness="3px" />
              <Text color={textColor} fontSize="lg">Chargement...</Text>
            </VStack>
          </Center>
        ) : (
          currentView === 'products' ? renderProductsView() : renderShopsView()
        )}
      </Container>
    </Box>
  )
}

// Composant NoResults séparé pour éviter les hooks conditionnels
function NoResults({ message, onClear }: { readonly message: string; readonly onClear: () => void }) {
  const textColor = useColorModeValue('gray.600', 'gray.400')
  
  return (
    <Center py={16} textAlign="center">
      <VStack spacing={4}>
        <Box
          p={6}
          borderRadius="full"
          bg={useColorModeValue('gray.100', 'gray.700')}
        >
          <CloseIcon boxSize={8} color={textColor} />
        </Box>
        <Text fontSize="xl" color={textColor} fontWeight="medium">
          {message}
        </Text>
        <IconButton
          aria-label="Effacer la recherche"
          icon={<CloseIcon />}
          onClick={onClear}
          size="md"
          colorScheme="brand"
          variant="ghost"
          borderRadius="full"
        />
      </VStack>
    </Center>
  )
}