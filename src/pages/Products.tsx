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
  Link as ChakraLink,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { FiPackage, FiGrid, FiFilter, FiTrendingUp, FiMenu } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

// Composant Carrousel inspiré de HeroProductGrid
function ProductsCarousel({ products, title, shopsMap }: { products: any[]; title: string; shopsMap: Record<string, any> }) {
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
      const cardWidth = 300
      const scrollAmount = cardWidth * 3.5
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const accentColor = useColorModeValue('#111111', 'white')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const bg = useColorModeValue('white', '#0e0e0e')
  const textColor = useColorModeValue('black', 'white')
  const muted = useColorModeValue('gray.500', 'gray.400')

  return (
    <Box
      position="relative"
      mb={12}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* En-tête de section avec titre et compteur */}
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

        {/* Indicateur de scroll */}
        {products.length > 1 && (
          <HStack spacing={2}>
            <Text fontSize="sm" color={useColorModeValue('#666666', 'gray.400')} fontWeight="500">
              Faites défiler
            </Text>
            <Icon as={ChevronRightIcon} color={useColorModeValue('#666666', 'gray.400')} />
          </HStack>
        )}
      </HStack>

      {/* Contrôles de navigation */}
      <Box position="relative">
        {canScrollLeft && isHovered && (
          <IconButton
            aria-label="Précédent"
            icon={<ChevronLeftIcon boxSize={8} />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg={bg}
            color={textColor}
            boxShadow="xl"
            borderRadius="full"
            size="lg"
            opacity={0.95}
            _hover={{ 
              opacity: 1, 
              transform: 'translateY(-50%) scale(1.1)',
              bg: accentColor,
              color: 'white'
            }}
            onClick={() => scroll('left')}
            transition="all 0.2s ease"
          />
        )}

        {canScrollRight && isHovered && (
          <IconButton
            aria-label="Suivant"
            icon={<ChevronRightIcon boxSize={8} />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            bg={bg}
            color={textColor}
            boxShadow="xl"
            borderRadius="full"
            size="lg"
            opacity={0.95}
            _hover={{ 
              opacity: 1, 
              transform: 'translateY(-50%) scale(1.1)',
              bg: accentColor,
              color: 'white'
            }}
            onClick={() => scroll('right')}
            transition="all 0.2s ease"
          />
        )}

        {/* Carrousel des produits - TOUJOURS activé */}
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
                width={{ base: '280px', md: '320px' }}
                minWidth={{ base: '280px', md: '320px' }}
              >
                <ProductCard
                  id={String(p.id)}
                  title={p.title || p.name}
                  price={p.price ?? p.amount}
                  description={p.description}
                  image_url={p.image_url ?? p.product_image}
                  images={p.images}
                  quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                  shopId={shop?.id || p.shop_id || p.seller_id}
                  shopName={shop?.name}
                  shopDomain={shop?.domain}
                  height={{ base: '320px', md: '380px' }}
                />
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
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
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Palette de couleurs Nike/Zara - sobre et contrastée
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
  const hoverBorderColor = useColorModeValue('#111111','gray.400')
  const tertiaryText = useColorModeValue('#888888','gray.400')

  const isMobile = useBreakpointValue({ base: true, md: false })

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

  React.useEffect(() => {
    if (!query.trim()) {
      setProducts(allProducts)
      const map = {} as Record<number, any[]>
      ;(allProducts || []).forEach((p: any) => {
        const cid = p.category_id ?? 0
        if (!map[cid]) map[cid] = []
        map[cid].push(p)
      })
      setCategorizedProducts(map)
      return
    }

    const terms = query.toLowerCase().trim().split(/\s+/)
    const filtered = (allProducts || []).filter((p) => {
      const searchText = `${p.title || p.name || ''} ${p.description || ''}`.toLowerCase()
      return terms.every(term => searchText.includes(term))
    })
    setProducts(filtered)
    const map = {} as Record<number, any[]>
    filtered.forEach((p: any) => {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    })
    setCategorizedProducts(map)
  }, [query, allProducts])

  // Produits populaires (exemple)
  const popularProducts = allProducts?.slice(0, 8) || []

  // Filtrer les produits par catégorie sélectionnée
  const filteredProducts = selectedCategory 
    ? categorizedProducts[parseInt(selectedCategory)] || []
    : products

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

  return (
    <Container maxW="container.xl" py={4} pb={{ base: '120px', md: 8 }} px={{ base: 4, md: 6 }}>
      {/* En-tête minimaliste style Nike/Zara */}
      <VStack spacing={6} align="stretch" mb={8}>
        {/* Barre supérieure avec titre */}
        <Flex justify="space-between" align="center" gap={4}>
          <Box flex="1">
            <Heading 
              size={{ base: "xl", md: "2xl" }}
              fontWeight="700" 
              color={textPrimary}
              letterSpacing="-0.5px"
              lineHeight="1.1"
            >
              Boutique
            </Heading>
            <Text color={textSecondary} fontSize={{ base: "md", md: "lg" }} mt={2} fontWeight="400">
              Découvrez notre sélection exclusive
            </Text>
          </Box>
          
          {/* Bouton filtre mobile */}
          {isMobile && (
            <IconButton
              aria-label="Filtrer par catégorie"
              icon={<FiFilter />}
              variant="outline"
              borderRadius="md"
              borderColor={borderColor}
              bg="white"
              onClick={onOpen}
              _hover={{ bg: subtleBg }}
            />
          )}
        </Flex>

        {/* Barre de recherche style Zara */}
        <Box>
          <InputGroup size={{ base: "md", md: "lg" }}>
            <InputLeftElement pointerEvents="none" height={{ base: "48px", md: "56px" }}>
              <Icon as={SearchIcon} color={iconColor} boxSize={{ base: 4, md: 5 }} />
            </InputLeftElement>
            <Input
              placeholder="Rechercher des produits..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg="white"
              borderRadius="none"
              border="1px solid"
              borderColor={borderColor}
              _hover={{ borderColor: accentColor }}
              _focus={{
                borderColor: accentColor,
                boxShadow: 'none',
                borderWidth: '1.5px'
              }}
              fontSize={{ base: "sm", md: "md" }}
              height={{ base: "48px", md: "56px" }}
              px={{ base: 10, md: 12 }}
              fontWeight="400"
              letterSpacing="0.2px"
            />
            {query && (
              <InputRightElement height={{ base: "48px", md: "56px" }}>
                <IconButton 
                  aria-label="Effacer la recherche" 
                  icon={<CloseIcon boxSize={3} />} 
                  size="sm"
                  variant="ghost"
                  borderRadius="none"
                  onClick={() => setQuery('')}
                  _hover={{ bg: 'transparent', color: accentColor }}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>
      </VStack>

      {/* Navigation par onglets - Version desktop style Nike */}
      {!isMobile && (
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
                <Icon as={StarIcon} boxSize={5} />
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
            {/* Onglet 1: Tous les produits */}
            <TabPanel px={0} pt={8}>
              {renderAllProducts()}
            </TabPanel>

            {/* Onglet 2: Produits populaires */}
            <TabPanel px={0} pt={8}>
              {renderPopularProducts()}
            </TabPanel>

            {/* Onglet 3: Nouveautés */}
            <TabPanel px={0} pt={8}>
              {renderNewProducts()}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {/* Version mobile - Layout simplifié */}
      {isMobile && (
        <Box>
          {query && (
            <Card bg={subtleBg} borderRadius="none" border="1px solid" borderColor={borderColor} mb={6}>
              <CardBody py={4}>
                <Flex justify="space-between" align="center">
                  <Text color={textPrimary} fontSize="md" fontWeight="500">
                    {products?.length || 0} résultat{(products?.length || 0) > 1 ? 's' : ''}
                  </Text>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setQuery('')}
                    rightIcon={<CloseIcon />}
                    fontWeight="500"
                    borderRadius="none"
                    _hover={{ bg: 'transparent', color: accentColor }}
                  >
                    Effacer
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          )}

          {/* Navigation mobile style Nike */}
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

          {/* Contenu mobile */}
          {activeTab === 0 && renderAllProducts()}
          {activeTab === 1 && renderPopularProducts()}
          {activeTab === 2 && renderNewProducts()}
        </Box>
      )}

      {/* Drawer des catégories pour mobile style Zara */}
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
            Catégories
          </DrawerHeader>
          <DrawerBody py={6} px={4}>
            <VStack align="stretch" spacing={1}>
              <Button
                variant={!selectedCategory ? "solid" : "ghost"}
                justifyContent="start"
                borderRadius="none"
                py={4}
                bg={!selectedCategory ? accentColor : "transparent"}
                color={!selectedCategory ? "white" : textPrimary}
                fontWeight="500"
                onClick={() => {
                  setSelectedCategory(null)
                  onClose()
                }}
                _hover={{
                  bg: !selectedCategory ? hoverColor : subtleBg
                }}
              >
                Toutes les catégories
              </Button>
              {categories?.filter(c => (categorizedProducts[c.id] || []).length > 0).map((c: any) => (
                <Button
                  key={c.id}
                  variant={selectedCategory === String(c.id) ? "solid" : "ghost"}
                  justifyContent="space-between"
                  borderRadius="none"
                  py={4}
                  bg={selectedCategory === String(c.id) ? accentColor : "transparent"}
                  color={selectedCategory === String(c.id) ? "white" : textPrimary}
                  fontWeight="500"
                  onClick={() => {
                    setSelectedCategory(String(c.id))
                    onClose()
                    document.getElementById(`category-${c.id}`)?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    })
                  }}
                  _hover={{
                    bg: selectedCategory === String(c.id) ? hoverColor : subtleBg
                  }}
                >
                  <Text>{c.name}</Text>
                  <Badge 
                    bg={selectedCategory === String(c.id) ? "white" : badgeBg} 
                    color={selectedCategory === String(c.id) ? accentColor : badgeColor}
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="none"
                    fontWeight="600"
                  >
                    {(categorizedProducts[c.id] || []).length}
                  </Badge>
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Container>
  )

  // Fonctions de rendu réutilisables
  function renderAllProducts() {
    return (
      <>
        {/* Catégories style Nike - Grille moderne */}
        {!query && categories && categories.filter(c => (categorizedProducts[c.id] || []).length > 0).length > 0 && !isMobile && (
          <Box mb={12}>
            <Text 
              fontSize="md" 
              fontWeight="600" 
              color={textPrimary} 
              mb={6} 
              textTransform="uppercase" 
              letterSpacing="1px"
            >
              Catégories
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={4}>
              {categories
                .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
                .map((c: any) => (
                  <Card 
                    key={c.id}
                    borderRadius="none"
                    border="1px solid"
                    borderColor={borderColor}
                    bg="white"
                    _hover={{ 
                      borderColor: accentColor,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    }}
                    cursor="pointer"
                    onClick={() => {
                      document.getElementById(`category-${c.id}`)?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }}
                  >
                    <CardBody p={4}>
                      <VStack spacing={3}>
                        <AspectRatio ratio={1} width="100%">
                          <Box 
                            bg={subtleBg}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={FiPackage} boxSize={6} color={textSecondary} />
                          </Box>
                        </AspectRatio>
                        <VStack spacing={1} width="100%">
                          <Text 
                            fontSize="sm" 
                            fontWeight="600" 
                            textAlign="center"
                            noOfLines={2}
                            color={textPrimary}
                          >
                            {c.name}
                          </Text>
                          <Badge 
                            bg={badgeBg}
                            color={badgeColor}
                            fontSize="2xs" 
                            px={2} 
                            py={0} 
                            borderRadius="none"
                            fontWeight="600"
                          >
                            {(categorizedProducts[c.id] || []).length}
                          </Badge>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Produits sans catégorie - TOUJOURS en carrousel sur desktop */}
        {(categorizedProducts[0] || []).length > 0 && (
          <Box mb={12}>
            {!isMobile ? (
              <ProductsCarousel 
                products={categorizedProducts[0] || []}
                title="Découvertes"
                shopsMap={shopsMap}
              />
            ) : (
              <>
                <HStack spacing={4} mb={6} align="center">
                  <Box w="4px" h="24px" bg={accentColor} borderRadius="none" />
                  <VStack align="start" spacing={1}>
                    <Heading size="md" fontWeight="700" color={textPrimary} letterSpacing="-0.5px">
                      Découvertes
                    </Heading>
                    <Text color={textSecondary} fontSize="sm" fontWeight="400">
                      {(categorizedProducts[0] || []).length} produit{(categorizedProducts[0] || []).length > 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </HStack>

                <SimpleGrid columns={2} gap={4}>
                  {(categorizedProducts[0] || []).map((p) => {
                    const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                    return (
                      <ProductCard 
                        key={p.id} 
                        id={String(p.id)} 
                        title={p.title || p.name} 
                        price={p.price ?? p.amount} 
                        description={p.description} 
                        image_url={p.image_url ?? p.product_image} 
                        images={p.images}
                        quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                        shopId={shop?.id || p.shop_id || p.seller_id}
                        shopName={shop?.name}
                        shopDomain={shop?.domain}
                        height="300px"
                      />
                    )
                  })}
                </SimpleGrid>
              </>
            )}
          </Box>
        )}

        {/* Produits par catégorie - TOUJOURS en carrousel sur desktop */}
        {categories && categories.length > 0 && (
          <VStack spacing={12} align="stretch">
            {categories
              .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
              .map((c: any) => (
                <Box key={c.id} id={`category-${c.id}`}>
                  {!isMobile ? (
                    <ProductsCarousel 
                      products={categorizedProducts[c.id] || []}
                      title={c.name}
                      shopsMap={shopsMap}
                    />
                  ) : (
                    <>
                      <HStack spacing={4} mb={6} align="center">
                        <Box w="4px" h="28px" bg={accentColor} borderRadius="none" />
                        <VStack align="start" spacing={1}>
                          <Heading size="lg" fontWeight="700" color={textPrimary} letterSpacing="-0.5px">
                            {c.name}
                          </Heading>
                          <Text color={textSecondary} fontSize="sm" fontWeight="400">
                            {(categorizedProducts[c.id] || []).length} produit{(categorizedProducts[c.id] || []).length > 1 ? 's' : ''}
                          </Text>
                        </VStack>
                      </HStack>

                      <SimpleGrid columns={2} gap={4}>
                        {(categorizedProducts[c.id] || []).map((p) => {
                          const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                          return (
                            <ProductCard
                              key={p.id}
                              id={String(p.id)}
                              title={p.title || p.name}
                              price={p.price ?? p.amount}
                              description={p.description}
                              image_url={p.image_url ?? p.product_image}
                              images={p.images}
                              quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                              shopId={shop?.id || p.shop_id || p.seller_id}
                              shopName={shop?.name}
                              shopDomain={shop?.domain}
                              height="300px"
                            />
                          )
                        })}
                      </SimpleGrid>
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
    return (
      !isMobile ? (
        <ProductsCarousel 
          products={popularProducts}
          title="Produits Populaires"
          shopsMap={shopsMap}
        />
      ) : (
        <SimpleGrid columns={2} gap={4}>
          {popularProducts.map((p) => {
            const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
            return (
              <ProductCard
                key={p.id}
                id={String(p.id)}
                title={p.title || p.name}
                price={p.price ?? p.amount}
                description={p.description}
                image_url={p.image_url ?? p.product_image}
                images={p.images}
                quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                shopId={shop?.id || p.shop_id || p.seller_id}
                shopName={shop?.name}
                shopDomain={shop?.domain}
                height="300px"
              />
            )
          })}
        </SimpleGrid>
      )
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