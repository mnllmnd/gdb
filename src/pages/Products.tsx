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
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon, StarIcon } from '@chakra-ui/icons'
import { FiPackage, FiGrid, FiFilter, FiTrendingUp, FiMenu } from 'react-icons/fi'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

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

  // Couleurs sobres
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('white', 'gray.800')
  const subtleBg = useColorModeValue('gray.50', 'gray.700')

  const gridColumns = useBreakpointValue({ 
    base: 'repeat(2, 1fr)', 
    sm: 'repeat(2, 1fr)', 
    md: 'repeat(3, 1fr)', 
    lg: 'repeat(4, 1fr)',
    xl: 'repeat(4, 1fr)'
  })

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
            color="gray.600" 
            thickness="3px" 
            emptyColor="gray.200"
          />
          <Text color="gray.600" fontSize="lg" fontWeight="500">
            Chargement...
          </Text>
        </VStack>
      </Center>
    </Container>
  )

  return (
    <Container maxW="container.xl" py={4} pb={{ base: '120px', md: 8 }} px={{ base: 4, md: 6 }}>
      {/* En-tête minimaliste */}
      <VStack spacing={4} align="stretch" mb={6}>
        {/* Barre supérieure avec titre et filtre mobile */}
        <Flex justify="space-between" align="center" gap={4}>
          <Box flex="1">
            <Heading 
              size={{ base: "lg", md: "xl" }}
              fontWeight="600" 
              color="gray.900"
              letterSpacing="-0.5px"
            >
              Boutique
            </Heading>
            <Text color="gray.600" fontSize={{ base: "sm", md: "lg" }} mt={1}>
              {products?.length || 0} produit{products?.length !== 1 ? 's' : ''}
            </Text>
          </Box>
          
          {/* Bouton filtre mobile */}
          {isMobile && (
            <IconButton
              aria-label="Filtrer par catégorie"
              icon={<FiFilter />}
              variant="outline"
              borderRadius="lg"
              borderColor={borderColor}
              onClick={onOpen}
            />
          )}
        </Flex>

        {/* Barre de recherche épurée */}
        <Box>
          <InputGroup size={{ base: "md", md: "lg" }}>
            <InputLeftElement pointerEvents="none" height={{ base: "48px", md: "56px" }}>
              <Icon as={SearchIcon} color="gray.400" boxSize={{ base: 4, md: 5 }} />
            </InputLeftElement>
            <Input
              placeholder="Rechercher des produits..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg={cardBg}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none'
              }}
              fontSize={{ base: "sm", md: "md" }}
              height={{ base: "48px", md: "56px" }}
              px={{ base: 10, md: 12 }}
              fontWeight="500"
            />
            {query && (
              <InputRightElement height={{ base: "48px", md: "56px" }}>
                <IconButton 
                  aria-label="Effacer la recherche" 
                  icon={<CloseIcon boxSize={3} />} 
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  borderRadius="full"
                  onClick={() => setQuery('')}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>
      </VStack>

      {/* Navigation par onglets - Version desktop */}
      {!isMobile && (
        <Tabs 
          variant="line" 
          colorScheme="gray" 
          mb={8}
          index={activeTab}
          onChange={setActiveTab}
        >
          <TabList borderBottom="1px solid" borderColor={borderColor}>
            <Tab 
              fontWeight="500" 
              color="gray.700"
              _selected={{ color: 'gray.900', borderColor: 'gray.900' }}
              py={3}
            >
              <HStack spacing={2}>
                <Icon as={FiGrid} boxSize={4} />
                <Text>Tous les produits</Text>
              </HStack>
            </Tab>
            <Tab 
              fontWeight="500" 
              color="gray.700"
              _selected={{ color: 'gray.900', borderColor: 'gray.900' }}
              py={3}
            >
              <HStack spacing={2}>
                <Icon as={StarIcon} boxSize={4} />
                <Text>Populaires</Text>
              </HStack>
            </Tab>
            <Tab 
              fontWeight="500" 
              color="gray.700"
              _selected={{ color: 'gray.900', borderColor: 'gray.900' }}
              py={3}
            >
              <HStack spacing={2}>
                <Icon as={FiTrendingUp} boxSize={4} />
                <Text>Nouveautés</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Onglet 1: Tous les produits */}
            <TabPanel px={0}>
              {renderAllProducts()}
            </TabPanel>

            {/* Onglet 2: Produits populaires */}
            <TabPanel px={0}>
              {renderPopularProducts()}
            </TabPanel>

            {/* Onglet 3: Nouveautés */}
            <TabPanel px={0}>
              {renderNewProducts()}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {/* Version mobile - Layout simplifié */}
      {isMobile && (
        <Box>
          {query && (
            <Card bg={subtleBg} borderRadius="lg" border="1px solid" borderColor={borderColor} mb={4}>
              <CardBody py={3}>
                <Flex justify="space-between" align="center">
                  <Text color="gray.700" fontSize="sm" fontWeight="500">
                    {products?.length || 0} résultat{(products?.length || 0) > 1 ? 's' : ''}
                  </Text>
                  <Button 
                    variant="ghost" 
                    size="xs"
                    onClick={() => setQuery('')}
                    rightIcon={<CloseIcon />}
                    fontWeight="500"
                  >
                    Effacer
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          )}

          {/* Navigation mobile simplifiée */}
          <SimpleGrid columns={3} spacing={2} mb={6}>
            <Button
              variant={activeTab === 0 ? "solid" : "outline"}
              size="sm"
              borderRadius="lg"
              bg={activeTab === 0 ? "gray.900" : "transparent"}
              color={activeTab === 0 ? "white" : "gray.700"}
              borderColor={borderColor}
              onClick={() => setActiveTab(0)}
            >
              Tous
            </Button>
            <Button
              variant={activeTab === 1 ? "solid" : "outline"}
              size="sm"
              borderRadius="lg"
              bg={activeTab === 1 ? "gray.900" : "transparent"}
              color={activeTab === 1 ? "white" : "gray.700"}
              borderColor={borderColor}
              onClick={() => setActiveTab(1)}
            >
              Populaires
            </Button>
            <Button
              variant={activeTab === 2 ? "solid" : "outline"}
              size="sm"
              borderRadius="lg"
              bg={activeTab === 2 ? "gray.900" : "transparent"}
              color={activeTab === 2 ? "white" : "gray.700"}
              borderColor={borderColor}
              onClick={() => setActiveTab(2)}
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

      {/* Drawer des catégories pour mobile */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Catégories
          </DrawerHeader>
          <DrawerBody py={4}>
            <VStack align="stretch" spacing={2}>
              <Button
                variant={!selectedCategory ? "solid" : "ghost"}
                justifyContent="start"
                onClick={() => {
                  setSelectedCategory(null)
                  onClose()
                }}
                bg={!selectedCategory ? "gray.100" : "transparent"}
              >
                Toutes les catégories
              </Button>
              {categories?.filter(c => (categorizedProducts[c.id] || []).length > 0).map((c: any) => (
                <Button
                  key={c.id}
                  variant={selectedCategory === String(c.id) ? "solid" : "ghost"}
                  justifyContent="space-between"
                  onClick={() => {
                    setSelectedCategory(String(c.id))
                    onClose()
                    document.getElementById(`category-${c.id}`)?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    })
                  }}
                  bg={selectedCategory === String(c.id) ? "gray.100" : "transparent"}
                >
                  <Text>{c.name}</Text>
                  <Badge bg="gray.200" color="gray.600" fontSize="xs">
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
        {!query && categories && categories.filter(c => (categorizedProducts[c.id] || []).length > 0).length > 0 && !isMobile && (
          <Box mb={6}>
            <Text fontSize="sm" fontWeight="600" color="gray.600" mb={3} textTransform="uppercase" letterSpacing="0.5px">
              Parcourir par catégorie
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={2}>
              {categories
                .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
                .map((c: any, index: number) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    size="sm"
                    height="auto"
                    py={2}
                    borderRadius="lg"
                    borderColor={borderColor}
                    _hover={{ bg: subtleBg, borderColor: 'gray.300' }}
                    onClick={() => {
                      document.getElementById(`category-${c.id}`)?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }}
                  >
                    <VStack spacing={1}>
                      <Text fontSize="xs" fontWeight="500" noOfLines={1}>
                        {c.name}
                      </Text>
                      <Badge 
                        bg="gray.100" 
                        color="gray.600"
                        fontSize="2xs" 
                        px={1} 
                        py={0} 
                        borderRadius="full"
                      >
                        {(categorizedProducts[c.id] || []).length}
                      </Badge>
                    </VStack>
                  </Button>
                ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Produits sans catégorie */}
        {(categorizedProducts[0] || []).length > 0 && (
          <Box mb={8}>
            <HStack spacing={3} mb={4} align="center">
              <Box w="3px" h="16px" bg="gray.400" borderRadius="full" />
              <Heading size={{ base: "sm", md: "md" }} fontWeight="600" color="gray.900">
                Autres produits
              </Heading>
              <Badge 
                bg="gray.100" 
                color="gray.600"
                fontSize="xs" 
                px={2} 
                py={1} 
                borderRadius="full"
                fontWeight="600"
              >
                {(categorizedProducts[0] || []).length}
              </Badge>
            </HStack>

            <Grid templateColumns={gridColumns} gap={{ base: 3, md: 6 }}>
              {(categorizedProducts[0] || []).map((p) => {
                const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                return (
                  <ProductCard 
                    key={p.id} 
                    id={String(p.id)} 
                    title={p.title || p.name} 
                    price={p.price ?? p.amount} 
                    image_url={p.image_url ?? p.product_image} 
                    images={p.images}
                    quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                    shopId={shop?.id || p.shop_id || p.seller_id}
                    shopName={shop?.name}
                    shopDomain={shop?.domain}
                  />
                )
              })}
            </Grid>
          </Box>
        )}

        {/* Produits par catégorie */}
        {categories && categories.length > 0 && (
          <VStack spacing={8} align="stretch">
            {categories
              .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
              .map((c: any) => (
                <Box key={c.id} id={`category-${c.id}`}>
                  <HStack spacing={3} mb={4} align="center">
                    <Box w="3px" h="20px" bg="gray.900" borderRadius="full" />
                    <VStack align="start" spacing={0}>
                      <Heading size={{ base: "sm", md: "lg" }} fontWeight="600" color="gray.900">
                        {c.name}
                      </Heading>
                      <Text color="gray.600" fontSize={{ base: "xs", md: "sm" }}>
                        {(categorizedProducts[c.id] || []).length} produit{(categorizedProducts[c.id] || []).length > 1 ? 's' : ''}
                      </Text>
                    </VStack>
                  </HStack>

                  <Grid templateColumns={gridColumns} gap={{ base: 3, md: 6 }}>
                    {(categorizedProducts[c.id] || []).map((p) => {
                      const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                      return (
                        <ProductCard
                          key={p.id}
                          id={String(p.id)}
                          title={p.title || p.name}
                          price={p.price ?? p.amount}
                          image_url={p.image_url ?? p.product_image}
                          images={p.images}
                          quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                          shopId={shop?.id || p.shop_id || p.seller_id}
                          shopName={shop?.name}
                          shopDomain={shop?.domain}
                        />
                      )
                    })}
                  </Grid>
                </Box>
              ))}
          </VStack>
        )}
      </>
    )
  }

  function renderPopularProducts() {
    return (
      <Grid templateColumns={gridColumns} gap={{ base: 3, md: 6 }}>
        {popularProducts.map((p) => {
          const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
          return (
            <ProductCard
              key={p.id}
              id={String(p.id)}
              title={p.title || p.name}
              price={p.price ?? p.amount}
              image_url={p.image_url ?? p.product_image}
              images={p.images}
              quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
              shopId={shop?.id || p.shop_id || p.seller_id}
              shopName={shop?.name}
              shopDomain={shop?.domain}
            />
          )
        })}
      </Grid>
    )
  }

  function renderNewProducts() {
    return (
      <Center py={16} minH="40vh">
        <VStack spacing={4}>
          <Icon as={FiTrendingUp} boxSize={12} color="gray.400" />
          <Text color="gray.600" fontSize="lg" fontWeight="500">
            Nouveautés à venir
          </Text>
          <Text color="gray.500" fontSize="sm" textAlign="center">
            De nouveaux produits arrivent bientôt
          </Text>
        </VStack>
      </Center>
    )
  }
}