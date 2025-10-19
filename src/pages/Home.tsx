import React from 'react'
import {
  Heading,
  Text,
  Container,
  Spinner,
  VStack,
  Box,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Grid,
  useBreakpointValue,
  Button,
  GridItem,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'
import { FiShoppingBag, FiTruck, FiShield } from 'react-icons/fi'
import ShopCard from '../components/ShopCard'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

export default function Home() {
  const [shops, setShops] = React.useState<any[] | null>(null)
  const [query, setQuery] = React.useState('')
  const [allShops, setAllShops] = React.useState<any[] | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadShops() {
      try {
        const s = await api.shops.list()
        setShops(s)
        setAllShops(s)
      } catch (err) {
        console.error('Failed to load shops', err)
        setShops([])
      } finally {
        setIsLoading(false)
      }
    }
    loadShops()
  }, [])

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (!query || query.trim() === '') {
          setShops(allShops)
          return
        }
        try {
          const res = await api.shops.search(query.trim())
          setShops(res)
        } catch (err) {
          console.warn('Server search failed, falling back to client-side filter', err)
          const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
          const filtered = (allShops || []).filter((s) => {
            const hay = `${s.name || ''} ${s.domain || ''} ${s.description || ''}`.toLowerCase()
            return terms.some((t) => hay.includes(t))
          })
          setShops(filtered)
        }
      } catch (err) {
        console.error('Search failed', err)
        setShops([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, allShops])

  // hauteur dynamique pour ShopCard — small fixed on mobile so cards align
  const cardHeight = useBreakpointValue({ base: '110px', md: '220px' })

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg="brand.500"
        color="white"
        py={16}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="brand.600"
          transform="skewY(-6deg)"
          transformOrigin="top left"
        />
        
        <Container maxW="container.xl" position="relative">
          <VStack spacing={6} align="start">
            <Heading
              size="2xl"
              bgGradient="linear(to-r, white, blue.200)"
              bgClip="text"
              letterSpacing="tight"
            >
              Sama Bitik
            </Heading>
            <Text fontSize="xl" maxW="lg" lineHeight="tall">
              Découvrez l'excellence du commerce local. Simple, élégant et sécurisé.
            </Text>
            <Button
              size="lg"
              colorScheme="white"
              variant="outline"
              _hover={{ bg: 'whiteAlpha.200' }}
              leftIcon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            >
              Explorer les boutiques
            </Button>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12} overflow="visible">

      {/* Section des boutiques */}
      <Box mb={6} w="100%">
        <InputGroup maxW="720px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher une boutique ou un produit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
          />
          {query && (
            <InputRightElement>
              <IconButton aria-label="clear" icon={<CloseIcon />} size="sm" onClick={() => setQuery('')} />
            </InputRightElement>
          )}
        </InputGroup>

        {shops === null && (
          <Center py={12}>
            <Spinner size="xl" color="brand.500" thickness="3px" />
          </Center>
        )}

        {shops && shops.length > 0 && (
          <Box>
            <Heading size="lg" mb={6}>
              {query ? `Résultats pour: '${query}'` : 'Boutiques'}
            </Heading>
            {query && (
              <Text mb={3} color="gray.600">
                {shops.length} résultat{shops.length > 1 ? 's' : ''}
              </Text>
            )}

            <Grid
              templateColumns={{
                base: 'repeat(auto-fill, minmax(140px, 1fr))',
                sm: 'repeat(auto-fill, minmax(160px, 1fr))',
                md: 'repeat(auto-fill, minmax(200px, 1fr))',
                lg: 'repeat(auto-fill, minmax(220px, 1fr))',
              }}
              gap={{ base: 4, sm: 5, md: 6 }}
              alignItems="stretch"
            >
              {shops.map((s) => (
                <ShopCard key={s.id} shop={s} compact={true} height={cardHeight} />
              ))}
            </Grid>
          </Box>
        )}

        {shops && shops.length === 0 && (
          <Center py={12}>
            <VStack spacing={4}>
              <Text fontSize="lg" color="white">
                Aucune boutique disponible pour le moment
              </Text>
              <Text color="white">Revenez plus tard pour découvrir nos boutiques partenaires</Text>
            </VStack>
          </Center>
        )}
      </Box>

      {/* Section produits récents */}
      <Box mt={10}>
        <Heading size="lg" mb={4}>
          Produits récents
        </Heading>
        <ProductListPreview cardHeight={cardHeight} />
      </Box>
    </Container>
  </Box>
  )
}

function ProductListPreview({ cardHeight }: { cardHeight?: any }) {
  const [products, setProducts] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const list = await api.products.list()
        if (!mounted) return
        setProducts((list || []).slice(0, 8))
      } catch (err) {
        console.error('Failed to load products', err)
        if (mounted) setProducts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return (
    <Box>
      <Text>Chargement...</Text>
    </Box>
  )
  if (!products || products.length === 0) return (
    <Box>
      <Text>Aucun produit récent.</Text>
    </Box>
  )

  return (
    <Box>
      <Grid
        templateColumns={{
          base: 'repeat(auto-fill, minmax(140px, 1fr))',
          sm: 'repeat(auto-fill, minmax(160px, 1fr))',
          md: 'repeat(auto-fill, minmax(200px, 1fr))',
          lg: 'repeat(auto-fill, minmax(220px, 1fr))',
        }}
        gap={{ base: 4, sm: 5, md: 6 }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} id={String(p.id)} title={p.title || p.name} price={p.price ?? p.amount} image={p.image_url ?? p.product_image} height={cardHeight} />
        ))}
      </Grid>
    </Box>
  )
}
