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
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'
import { FiPackage, FiGrid } from 'react-icons/fi'
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

  // Tailles responsives
  const gridColumns = useBreakpointValue({ 
    base: 'repeat(2, 1fr)', 
    sm: 'repeat(2, 1fr)', 
    md: 'repeat(3, 1fr)', 
    lg: 'repeat(4, 1fr)',
    xl: 'repeat(5, 1fr)'
  })

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

        // Build quick lookup maps for shops by id and owner_id
        const byId: Record<string, any> = {}
        const byOwner: Record<string, any> = {}
        ;(shopsData || []).forEach((s: any) => {
          if (s?.id) byId[String(s.id)] = s
          if (s?.owner_id) byOwner[String(s.owner_id)] = s
        })
        setShopsMap({ byId, byOwner })

        // build categorized map
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

  // Filtrage des produits basé sur la recherche
  React.useEffect(() => {
    if (!query.trim()) {
      setProducts(allProducts)
      // rebuild categorizedProducts from allProducts
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
    // update categorizedProducts for filtered results
    const map = {} as Record<number, any[]>
    ;filtered.forEach((p: any) => {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    })
    setCategorizedProducts(map)
  }, [query, allProducts])

  if (loading) return (
    <Container maxW="container.xl" py={8}>
      <Center minH="60vh">
        <VStack spacing={4}>
          <Box position="relative">
            <Spinner 
              size="xl" 
              color="brand.500" 
              thickness="4px" 
              speed="0.8s"
              emptyColor="gray.200"
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
          <Text color="gray.600" fontSize="lg" fontWeight="500">
            Chargement des produits...
          </Text>
        </VStack>
      </Center>
    </Container>
  )

  return (
    <Container maxW="container.xl" py={8} pb={{ base: '120px', md: 8 }}>
      {/* En-tête Hero */}
      <Box 
        mb={10}
        p={{ base: 6, md: 10 }}
        bg="white"
        borderRadius="2xl"
        boxShadow="xl"
        border="1px solid"
        borderColor="gray.100"
        position="relative"
        overflow="hidden"
      >
        {/* Decoration background */}
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          width="200px"
          height="200px"
          bg="brand.50"
          borderRadius="full"
          opacity="0.5"
          filter="blur(40px)"
        />
        
        <VStack spacing={6} position="relative" zIndex={1}>
          <VStack spacing={3}>
            <HStack spacing={2}>
              <Icon as={FiGrid} boxSize={8} color="brand.500" />
              <Heading 
                size="2xl" 
                textAlign="center"
                color="gray.800"
                fontWeight="800"
              >
                Nos Produits
              </Heading>
            </HStack>
            
            <Text 
              color="gray.600" 
              textAlign="center" 
              maxW="2xl" 
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="500"
            >
              Découvrez notre sélection de produits soigneusement choisis pour vous
            </Text>

            {!query && products && (
              <Badge 
                colorScheme="brand" 
                fontSize="md" 
                px={4} 
                py={2} 
                borderRadius="full"
                fontWeight="600"
              >
                {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
              </Badge>
            )}
          </VStack>

          {/* Barre de recherche moderne */}
          <Box w="100%" maxW="720px">
            <InputGroup 
              size="lg" 
              boxShadow="0 8px 24px rgba(0,0,0,0.08)" 
              borderRadius="xl"
            >
              <InputLeftElement pointerEvents="none" height="64px">
                <Icon as={SearchIcon} color="brand.400" boxSize={5} />
              </InputLeftElement>
              <Input
                placeholder="Rechercher un produit, une catégorie..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                bg="white"
                borderRadius="xl"
                border="2px solid"
                borderColor="gray.200"
                _hover={{ borderColor: 'brand.300' }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 3px rgba(157, 123, 106, 0.1)'
                }}
                fontSize="md"
                height="64px"
                px={12}
                fontWeight="500"
              />
              {query && (
                <InputRightElement height="64px">
                  <IconButton 
                    aria-label="Effacer la recherche" 
                    icon={<CloseIcon />} 
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    borderRadius="full"
                    onClick={() => setQuery('')}
                    _hover={{ bg: 'gray.100' }}
                  />
                </InputRightElement>
              )}
            </InputGroup>
          </Box>
        </VStack>
      </Box>

      {/* Résultats de recherche */}
      {query && (
        <Card 
          mb={6}
          bg="blue.50"
          borderRadius="xl"
          border="1px solid"
          borderColor="blue.200"
        >
          <CardBody p={5}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Icon as={SearchIcon} color="blue.600" boxSize={5} />
                <Text color="gray.700" fontSize="lg" fontWeight="600">
                  {products?.length || 0} résultat{(products?.length || 0) > 1 ? 's' : ''} pour "{query}"
                </Text>
              </HStack>
              <Button 
                variant="ghost" 
                colorScheme="blue" 
                size="sm"
                onClick={() => setQuery('')}
                rightIcon={<CloseIcon />}
                fontWeight="600"
              >
                Effacer
              </Button>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Produits organisés par catégorie */}
      {products && products.length > 0 ? (
        <VStack spacing={10} align="stretch">
          {/* Produits sans catégorie */}
          {(categorizedProducts[0] || []).length > 0 && (
            <Box>
              <Card 
                bg="white"
                mb={6}
                borderRadius="xl"
                boxShadow="md"
                border="1px solid"
                borderColor="gray.200"
              >
                <CardBody p={5}>
                  <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
                    <HStack spacing={3}>
                      <Box 
                        p={2} 
                        bg="gray.100" 
                        borderRadius="lg"
                      >
                        <Icon as={FiPackage} boxSize={6} color="gray.600" />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Heading size="md" color="gray.800" fontWeight="700">
                          Autres produits
                        </Heading>
                        <Text fontSize="sm" color="gray.500">
                          Produits non catégorisés
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge 
                      colorScheme="gray" 
                      fontSize="md" 
                      px={3} 
                      py={1} 
                      borderRadius="full"
                      fontWeight="600"
                    >
                      {(categorizedProducts[0] || []).length}
                    </Badge>
                  </Flex>
                </CardBody>
              </Card>

              <Grid templateColumns={gridColumns} gap={{ base: 3, md: 4 }}>
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
            categories
              .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
              .map((c: any, index: number) => (
                <Box key={c.id}>
                  {/* En-tête de catégorie élégante */}
                  <Card 
                    bg="white"
                    mb={6}
                    borderRadius="xl"
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ 
                      boxShadow: 'xl',
                      transform: 'translateY(-2px)'
                    }}
                  >
                    <Box
                      h="6px"
                      bg={`${['blue', 'purple', 'green', 'orange', 'pink'][index % 5]}.400`}
                    />
                    <CardBody p={6}>
                      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
                        <HStack spacing={4}>
                          <Box 
                            p={3} 
                            bg={`${['blue', 'purple', 'green', 'orange', 'pink'][index % 5]}.50`}
                            borderRadius="xl"
                          >
                            <Icon 
                              as={FiGrid} 
                              boxSize={7} 
                              color={`${['blue', 'purple', 'green', 'orange', 'pink'][index % 5]}.600`}
                            />
                          </Box>
                          <VStack align="start" spacing={1}>
                            <Heading size="lg" color="gray.800" fontWeight="700">
                              {c.name}
                            </Heading>
                            <Text color="gray.600" fontSize="sm" fontWeight="500">
                              Découvrez notre sélection {c.name.toLowerCase()}
                            </Text>
                          </VStack>
                        </HStack>
                        <Badge 
                          colorScheme={['blue', 'purple', 'green', 'orange', 'pink'][index % 5]}
                          fontSize="md" 
                          px={4} 
                          py={2} 
                          borderRadius="full"
                          fontWeight="600"
                        >
                          {(categorizedProducts[c.id] || []).length} produit{(categorizedProducts[c.id] || []).length > 1 ? 's' : ''}
                        </Badge>
                      </Flex>
                    </CardBody>
                  </Card>

                  {/* Grille des produits */}
                  <Grid templateColumns={gridColumns} gap={{ base: 3, md: 4 }}>
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
              ))
          )}
        </VStack>
      ) : (
        <Center py={16} minH="40vh">
          <Card 
            maxW="md" 
            textAlign="center"
            bg="white"
            borderRadius="2xl"
            boxShadow="xl"
            border="1px solid"
            borderColor="gray.100"
          >
            <CardBody p={10}>
              <VStack spacing={5}>
                <Box 
                  p={5} 
                  bg="gray.50" 
                  borderRadius="full"
                  border="2px dashed"
                  borderColor="gray.300"
                >
                  <Icon as={SearchIcon} boxSize={12} color="gray.400" />
                </Box>
                <VStack spacing={2}>
                  <Heading size="md" color="gray.700">
                    Aucun produit trouvé
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    {query ? 
                      `Aucun produit ne correspond à "${query}"` : 
                      "Aucun produit n'est disponible pour le moment"
                    }
                  </Text>
                </VStack>
                {query && (
                  <Button 
                    colorScheme="brand" 
                    size="lg"
                    borderRadius="xl"
                    fontWeight="600"
                    onClick={() => setQuery('')}
                    px={8}
                  >
                    Voir tous les produits
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Center>
      )}

      {/* Bouton retour en haut flottant */}
      {products && products.length > 8 && (
        <Box
          position="fixed"
          bottom={{ base: '100px', md: '30px' }}
          right={{ base: '20px', md: '30px' }}
          zIndex={10}
        >
          <Button
            colorScheme="brand"
            size="lg"
            borderRadius="full"
            boxShadow="0 8px 24px rgba(0,0,0,0.15)"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            width="56px"
            height="56px"
            p={0}
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
            }}
            transition="all 0.3s"
          >
            ↑
          </Button>
        </Box>
      )}
    </Container>
  )
}