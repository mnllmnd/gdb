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
  Image,
  Button,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon, StarIcon } from '@chakra-ui/icons'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

export default function Products() {
  const [products, setProducts] = React.useState<any[] | null>(null)
  const [categories, setCategories] = React.useState<any[] | null>(null)
  const [shopsMap, setShopsMap] = React.useState<Record<string, any>>({})
  const [categorizedProducts, setCategorizedProducts] = React.useState<Record<number, any[]>>({})
  const [query, setQuery] = React.useState('')
  const [currentView, setCurrentView] = React.useState<'all' | 'category'>('all')
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
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
  const categoryGridColumns = useBreakpointValue({
    base: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)'
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
          <Spinner size="xl" color="blue.500" thickness="3px" speed="0.65s" />
          <Text color="gray.600" fontSize="lg">Chargement des produits...</Text>
        </VStack>
      </Center>
    </Container>
  )

  return (
    <Container maxW="container.xl" py={8} pb={{ base: '120px', md: 8 }}>
      {/* En-tête avec recherche */}
      <VStack spacing={6} mb={8}>
        <Heading 
          size="xl" 
          textAlign="center"
          bgGradient="linear(to-r, white, purple.800)"
          bgClip="text"
          fontWeight="700"
        >
          Découvrez nos produits
        </Heading>
        
        <Text color="white" textAlign="center" maxW="2xl" fontSize="lg">
          Explorez notre sélection de produits soigneusement choisis pour vous
        </Text>

        {/* Barre de recherche améliorée */}
        <Box w="100%" maxW="720px">
          <InputGroup size="lg" boxShadow="0 4px 12px rgba(0,0,0,0.1)" borderRadius="xl">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="blue.500" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher un produit, une catégorie..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg="white"
              borderRadius="xl"
              border="2px solid"
              borderColor="gray.100"
              _hover={{ borderColor: 'blue.200' }}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500'
              }}
              fontSize="md"
              height="56px"
            />
            {query && (
              <InputRightElement>
                <IconButton 
                  aria-label="Effacer la recherche" 
                  icon={<CloseIcon />} 
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => setQuery('')}
                  _hover={{ bg: 'gray.100' }}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>
      </VStack>

      {/* Résultats de recherche */}
      {query && (
        <Box mb={6}>
          <Flex justify="space-between" align="center" mb={4}>
            <Text color="gray.600" fontSize="lg">
              {products?.length} produit(s) trouvé(s) pour "{query}"
            </Text>
            <Button 
              variant="ghost" 
              colorScheme="blue" 
              size="sm"
              onClick={() => setQuery('')}
              rightIcon={<CloseIcon />}
            >
              Effacer
            </Button>
          </Flex>
        </Box>
      )}

      {/* Produits organisés par catégorie */}
      {products && products.length > 0 ? (
        <>
          {/* Produits sans catégorie */}
          { (categorizedProducts[0] || []).length > 0 && (
            <Box mb={12}>
              <Flex align="center" justify="space-between" mb={6}>
                <Heading size="lg" color="gray.800">Autres produits</Heading>
                <Badge colorScheme="gray" fontSize="md" px={3} py={1} borderRadius="full">
                  {(categorizedProducts[0] || []).length} produit(s)
                </Badge>
              </Flex>
              <Grid templateColumns={gridColumns} gap={4}>
                {(categorizedProducts[0] || []).map((p) => {
                  const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                  return (
                    <ProductCard 
                      key={p.id} 
                      id={String(p.id)} 
                      title={p.title || p.name} 
                      price={p.price ?? p.amount} 
                      image_url={p.image_url ?? p.product_image} 
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
              .map((c: any) => (
                <Box key={c.id} mb={12}>
                  {/* En-tête de catégorie */}
                  <Card 
                    bg="white"
                    mb={6}
                    borderRadius="2xl"
                    boxShadow="0 8px 32px rgba(0,0,0,0.08)"
                    border="1px solid"
                    borderColor="gray.100"
                    overflow="hidden"
                  >
                    <CardBody p={6}>
                      <Flex align="center" justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Heading size="lg" color="gray.800" fontWeight="700">
                            {c.name}
                          </Heading>
                          <Text color="gray.600" fontSize="md">
                            Découvrez notre sélection: {c.name.toLowerCase()}
                          </Text>
                        </VStack>
                        <Badge 
                          colorScheme="blue" 
                          fontSize="md" 
                          px={4} 
                          py={2} 
                          borderRadius="full"
                          bg="blue.50"
                          color="blue.700"
                        >
                          {(categorizedProducts[c.id] || []).length} produit(s)
                        </Badge>
                      </Flex>
                    </CardBody>
                  </Card>

                  {/* Grille des produits */}
                  <Grid templateColumns={gridColumns} gap={4}>
                    {(categorizedProducts[c.id] || []).map((p) => {
                      const shop = (shopsMap.byId && shopsMap.byId[String(p.shop_id)]) || (shopsMap.byOwner && shopsMap.byOwner[String(p.seller_id)])
                      return (
                        <ProductCard
                          key={p.id}
                          id={String(p.id)}
                          title={p.title || p.name}
                          price={p.price ?? p.amount}
                          image_url={p.image_url ?? p.product_image}
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
        </>
      ) : (
        <Center py={16} minH="40vh">
          <VStack spacing={4} textAlign="center">
            <Box p={4} bg="gray.100" borderRadius="full">
              <SearchIcon boxSize={8} color="gray.400" />
            </Box>
            <Heading size="md" color="gray.600">Aucun produit trouvé</Heading>
            <Text color="gray.500" maxW="md">
              {query ? 
                `Aucun produit ne correspond à "${query}". Essayez d'autres termes.` : 
                "Aucun produit n'est disponible pour le moment."
              }
            </Text>
            {query && (
              <Button 
                colorScheme="blue" 
                variant="outline"
                onClick={() => setQuery('')}
              >
                Voir tous les produits
              </Button>
            )}
          </VStack>
        </Center>
      )}

      {/* Bouton retour en haut pour mobile */}
      {products && products.length > 8 && (
        <Box
          position="fixed"
          bottom="100px"
          right="20px"
          zIndex={10}
        >
          <Button
            colorScheme="blue"
            size="sm"
            borderRadius="full"
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Haut
          </Button>
        </Box>
      )}
    </Container>
  )
}