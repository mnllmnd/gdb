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
  Icon,
  Card,
  CardBody,
} from '@chakra-ui/react'
import { CloseIcon, StarIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { FiPackage, FiTrendingUp, FiGrid, FiShoppingBag } from 'react-icons/fi'
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

const SmoothCarousel: React.FC<{ 
  children: React.ReactNode; 
  speed?: number;
  cardWidth?: string | number;
}> = ({ 
  children, 
  speed = 20,
  cardWidth = "280px"
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [startX, setStartX] = React.useState(0)
  const [scrollLeft, setScrollLeft] = React.useState(0)

  // Animation automatique
  React.useEffect(() => {
    if (isHovered || isDragging) return
    
    const scroll = scrollRef.current
    if (!scroll) return

    const scrollSpeed = speed / 20 // Ralenti
    let animationId: number

    const animate = () => {
      if (scroll && !isHovered && !isDragging) {
        scroll.scrollLeft += scrollSpeed
        
        // Boucle infinie
        if (scroll.scrollLeft >= scroll.scrollWidth / 2) {
          scroll.scrollLeft = 0
        }
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [speed, isHovered, isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0))
    setScrollLeft(scrollRef.current?.scrollLeft || 0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setIsHovered(false)
  }

  return (
    <Box
      ref={scrollRef}
      overflowX="auto"
      overflowY="hidden"
      css={{
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          '&:hover': {
            background: 'rgba(0,0,0,0.3)',
          },
        },
        scrollBehavior: 'smooth',
      }}
      cursor={isDragging ? 'grabbing' : 'grab'}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      userSelect="none"
    >
      <HStack 
        spacing={4}
        flexWrap="nowrap"
        minH="320px"
        align="stretch"
      >
        {/* Dupliquer le contenu pour l'effet de boucle infinie */}
        {React.Children.map(children, (child) =>
          React.isValidElement(child) 
            ? React.cloneElement(child, { 
                width: cardWidth,
                flex: '0 0 auto'
              } as any)
            : child
        )}
        {React.Children.map(children, (child) =>
          React.isValidElement(child) 
            ? React.cloneElement(child, { 
                width: cardWidth,
                flex: '0 0 auto'
              } as any)
            : child
        )}
      </HStack>
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
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400')

  const loadMoreCount = 6
  const [visibleByCategory, setVisibleByCategory] = React.useState<Record<number, number>>({})
  const [visibleUncategorized, setVisibleUncategorized] = React.useState<number>(initialCount)

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
    setVisibleByCategory({})
    setVisibleUncategorized(initialCount)
  }, [products, initialCount])

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

  const renderProductsView = () => {
    if (!products?.length) {
      return <NoResults message="Aucun produit trouvé" onClear={() => handleSearch('')} />
    }

    const showCarousel = selectedCategory === null

    return (
      <VStack spacing={8} align="stretch">
        {/* Carrousel des nouveautés */}
        {showCarousel && (() => {
          const newProducts = [...(products || [])]
            .sort((a, b) => {
              const ta = a.created_at ? new Date(String(a.created_at)).getTime() : 0
              const tb = b.created_at ? new Date(String(b.created_at)).getTime() : 0
              return tb - ta
            })
            .slice(0, 12)
          if (!newProducts.length) return null

          return (
            <Card
              bg={sectionBg}
              borderRadius="xl"
              boxShadow="lg"
              border="1px solid"
              borderColor={borderColor}
              overflow="hidden"
            >
              <CardBody p={6}>
                <HStack spacing={3} mb={4}>
                  
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color={textColor}>
                       Nouveautés
                    </Heading>
                    <Text fontSize="sm" color={secondaryTextColor}>
                      Découvrez nos derniers produits
                    </Text>
                  </VStack>
                  <Badge
                    ml="auto"
                    colorScheme="purple"
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {newProducts.length}
                  </Badge>
                </HStack>

                <SmoothCarousel speed={30} cardWidth="280px">
                  {newProducts.map((product) => (
                    <Box
                      key={product.id}
                      flex="0 0 auto"
                      w="280px"
                      px={2}
                    >
                      <ProductCard
                        id={String(product.id)}
                        title={product.title || product.name || ''}
                        description={product.description || ''}
                        price={product.price ?? product.amount}
                        images={normalizeImages(product)}
                        quantity={Number( 
                          product.quantity ??
                          product.quantite ??
                          product.stock ??
                          product.amount_available ??
                          0
                        )}
                        height="300px"
                        shopId={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]) )?.id || product.shop_id || product.seller_id}
                        shopName={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]))?.name}
                        shopDomain={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]))?.domain}
                      />
                    </Box>
                  ))}
                </SmoothCarousel>
              </CardBody>
            </Card>
          )
        })()}
        
        {selectedCategory === null ? (
          <Fade in={!isLoading}>
            <VStack spacing={8}>
              {renderUncategorizedProducts()}
              {categories
                .filter(category => (categorizedProducts[category.id] || []).length > 0)
                .map((category, index) => (
                  <Box key={category.id} w="100%">
                    {renderProductCategory(category, index)}
                  </Box>
                ))}
            </VStack>
          </Fade>
        ) : (
          <ScaleFade in={!isLoading}>
            <SimpleGrid 
              columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
              spacing={4}
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
                    description={product.description || ''}
                    price={product.price ?? product.amount}
                    images={normalizeImages(product)}
                    quantity={Number(
                      product.quantity ??
                      product.quantite ??
                      product.stock ??
                      product.amount_available ??
                      0
                    )}
                    height={cardHeight}
                    shopId={((shopsMap.byId && shopsMap.byId[String(product.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(product.seller_id)]) )?.id || product.shop_id || product.seller_id}
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
      <Card
        bg={categoryBg}
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
              bg="blue.50"
              borderRadius="lg"
            >
              <Icon as={FiPackage} boxSize={6} color="blue.500" />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color={textColor}>
                🎁 Découvertes
              </Heading>
              <Text fontSize="sm" color={secondaryTextColor}>
                Produits uniques et variés
              </Text>
            </VStack>
            <Badge
              ml="auto"
              colorScheme="blue"
              fontSize="md"
              px={3}
              py={1}
              borderRadius="full"
            >
              {uncategorizedProducts.length}
            </Badge>
          </HStack>
          
          <SimpleGrid 
            columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
            spacing={4}
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
                    description={product.description || ''}
                    price={product.price ?? product.amount}
                    images={normalizeImages(product)}
                    height={cardHeight}
                    shopId={shop?.id || product.shop_id || product.seller_id}
                    shopName={shop?.name}
                    shopDomain={shop?.domain}
                  />
                </Box>
              )
            })}
          </SimpleGrid>

          {uncategorizedProducts.length > toShow.length && (
            <Center mt={4}>
              <Button 
                size="md" 
                variant="outline"
                colorScheme="blue"
                borderRadius="full"
                onClick={() => setVisibleUncategorized(v => v + loadMoreCount)}
              >
                Voir plus
              </Button>
            </Center>
          )}
        </CardBody>
      </Card>
    )
  }

  const renderProductCategory = (category: Category, index: number) => {
    const categoryProducts = categorizedProducts[category.id] || []
    if (categoryProducts.length === 0) return null
    const visible = visibleByCategory[category.id] ?? initialCount
    const toShow = categoryProducts.slice(0, visible)

    const colorSchemes = ['green', 'orange', 'pink', 'teal', 'cyan']
    const colorScheme = colorSchemes[index % colorSchemes.length]

    return (
      <Card
        bg={sectionBg}
        borderRadius="xl"
        boxShadow="md"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        transition="all 0.3s ease"
        _hover={{
          boxShadow: 'lg',
          borderColor: `${colorScheme}.300`,
        }}
      >
        <Box
          h="4px"
          bg={`${colorScheme}.400`}
        />
        <CardBody p={6}>
          <HStack spacing={3} mb={4}>
            <Box
              p={2}
              bg={`${colorScheme}.50`}
              borderRadius="lg"
            >
              <Icon as={FiGrid} boxSize={6} color={`${colorScheme}.500`} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color={textColor}>
                {category.name}
              </Heading>
              <Text fontSize="sm" color={secondaryTextColor}>
                Découvrez notre collection
              </Text>
            </VStack>
            <Badge
              ml="auto"
              colorScheme={colorScheme}
              fontSize="md"
              px={3}
              py={1}
              borderRadius="full"
            >
              {categoryProducts.length}
            </Badge>
          </HStack>
          
          <SimpleGrid 
            columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
            spacing={4}
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
                    description={product.description || ''}
                    price={product.price ?? product.amount}
                    images={normalizeImages(product)}
                    quantity={Number(
                      product.quantity ??
                      product.quantite ??
                      product.stock ??
                      product.amount_available ??
                      0
                    )}
                    height={cardHeight}
                    shopId={shop?.id || product.shop_id || product.seller_id}
                    shopName={shop?.name}
                    shopDomain={shop?.domain}
                  />
                </Box>
              )
            })}
          </SimpleGrid>

          {categoryProducts.length > toShow.length && (
            <Center mt={4}>
              <Button 
                size="md"
                variant="outline"
                colorScheme={colorScheme}
                borderRadius="full"
                onClick={() => setVisibleByCategory(prev => ({ ...prev, [category.id]: (prev[category.id] || initialCount) + loadMoreCount }))}
              >
                Voir plus
              </Button>
            </Center>
          )}
        </CardBody>
      </Card>
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
          currentView === 'products' ? renderProductsView() : renderShopsView()
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