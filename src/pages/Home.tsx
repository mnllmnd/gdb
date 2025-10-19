import React from 'react'
import {
  Heading,
  Text,
  Container,
  Spinner,
  VStack,
  Box,
  Center,
  Grid,
  GridItem,
  useBreakpointValue,
  IconButton,
} from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'
import FilterNav from '../components/FilterNav'
import ShopCard from '../components/ShopCard'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

export default function Home() {
  const [shops, setShops] = React.useState<any[] | null>(null)
  const [products, setProducts] = React.useState<any[] | null>(null)
  const [query, setQuery] = React.useState('')
  const [currentView, setCurrentView] = React.useState<'shops' | 'products'>('shops')
  const [isLoading, setIsLoading] = React.useState(true)

  // hauteur commune pour les cartes (mobile = 80px, desktop = 160px)
  const cardHeight = useBreakpointValue({ base: '80px', md: '160px' })

  React.useEffect(() => {
    async function loadData() {
      try {
        const [shopsData, productsData] = await Promise.all([
          api.shops.list(),
          api.products.list(),
        ])
        setShops(shopsData)
        // take recent products from the list (assume API returns newest first)
        setProducts((productsData || []).slice(0, 12))
      } catch (err) {
        console.error('Failed to load data', err)
        setShops([])
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // recherche débouncée déclenchant une recherche côté serveur selon la vue
  React.useEffect(() => {
    if (!query || query.trim() === '') return
    const t = setTimeout(async () => {
      setIsLoading(true)
      try {
        if (currentView === 'shops') {
          const res = await api.shops.search(query.trim())
          setShops(res)
        } else {
          // API has no products.search — fetch list and filter client-side
          const all = await api.products.list()
          const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
          const filtered = (all || []).filter((p: any) => {
            const hay = `${p.title || p.name || ''} ${p.description || ''}`.toLowerCase()
            return terms.every((t) => hay.includes(t))
          })
          setProducts(filtered)
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, currentView])

  // When the query is cleared (or when view changes while there's no query),
  // reload the appropriate full list so the UI returns to the unfiltered state.
  React.useEffect(() => {
    if (query && query.trim() !== '') return
    let mounted = true
    ;(async () => {
      setIsLoading(true)
      try {
        if (currentView === 'shops') {
          const s = await api.shops.list()
          if (mounted) setShops(s)
        } else {
          const p = await api.products.list()
          if (mounted) setProducts((p || []).slice(0, 12))
        }
      } catch (err) {
        console.error('Reload failed', err)
        if (mounted) {
          if (currentView === 'shops') setShops([])
          else setProducts([])
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [query, currentView])

  return (
    <Box>
      {/* Hero */}
      <Box bg="brand.500" color="white" py={16} position="relative" overflow="hidden">
        <Box position="absolute" top="0" left="0" right="0" bottom="0" bg="brand.600" transform="skewY(-6deg)" transformOrigin="top left" />
        <Container maxW="container.xl" position="relative">
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Heading size="2xl" mb={4}>{currentView === 'shops' ? 'Découvrez nos boutiques' : 'Produits récents'}</Heading>
              <Text fontSize="xl" color="whiteAlpha.900">
                {currentView === 'shops' ? 'Les meilleurs produits, directement des artisans' : 'Explorez les produits disponibles'}
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Filtres / recherche */}
      <FilterNav view={currentView} onViewChange={setCurrentView} searchQuery={query} onSearchChange={setQuery} />

      {/* Contenu principal */}
      <Container maxW={{ base: '95%', md: '85%', lg: '80%' }} py={4}>
        {isLoading ? (
          <Center py={4}><Spinner size="md" /></Center>
        ) : (
          <>
            {currentView === 'shops' ? (
              shops?.length ? (
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2}>
                  {shops.map((shop) => (
                    <GridItem key={shop.id}>
                      <ShopCard {...shop} compact height={cardHeight} />
                    </GridItem>
                  ))}
                </Grid>
              ) : query ? (
                <Box textAlign="center" py={8}>
                  <Text fontSize="lg" mb={4}>Aucune boutique ne correspond à votre recherche</Text>
                  <IconButton
                    aria-label="Effacer la recherche"
                    icon={<CloseIcon />}
                    onClick={() => setQuery('')}
                    size="md"
                    colorScheme="brand"
                    variant="outline"
                  />
                </Box>
              ) : null
            ) : (
              products?.length ? (
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={2}>
                  {products.map((product) => (
                    <GridItem key={product.id}>
                      <ProductCard {...product} image_url={product.image_url ?? product.product_image} height={cardHeight} />
                    </GridItem>
                  ))}
                </Grid>
              ) : query ? (
                <Box textAlign="center" py={8}>
                  <Text fontSize="lg" mb={4}>Aucun produit ne correspond à votre recherche</Text>
                  <IconButton
                    aria-label="Effacer la recherche"
                    icon={<CloseIcon />}
                    onClick={() => setQuery('')}
                    size="md"
                    colorScheme="brand"
                    variant="outline"
                  />
                </Box>
              ) : null
            )}
          </>
        )}

        {/* Aperçu des produits récents — visible uniquement quand on voit les boutiques */}
       
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
    return () => { mounted = false }
  }, [])

  if (loading) return <Box><Text>Chargement...</Text></Box>
  if (!products || products.length === 0) return <Box><Text>Aucun produit récent.</Text></Box>

  return (
    <Box>
      <Grid templateColumns={{ base: 'repeat(auto-fill, minmax(140px, 1fr))', sm: 'repeat(auto-fill, minmax(160px, 1fr))', md: 'repeat(auto-fill, minmax(200px, 1fr))' }} gap={{ base: 4, sm: 5, md: 6 }}>
        {products.map((p) => (
          <ProductCard key={p.id} id={String(p.id)} title={p.title || p.name} price={p.price ?? p.amount} image_url={p.image_url ?? p.product_image} height={cardHeight} />
        ))}
      </Grid>
    </Box>
  )
}
