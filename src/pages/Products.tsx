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
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'
import ProductCard from '../components/ProductCard'
import api from '../services/api'

export default function Products() {
  const [products, setProducts] = React.useState<any[] | null>(null)
  const [query, setQuery] = React.useState('')
  const [allProducts, setAllProducts] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const list = await api.products.list()
        if (!mounted) return
        setProducts(list || [])
        setAllProducts(list || [])
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

  // Filtrage des produits basé sur la recherche
  React.useEffect(() => {
    if (!query.trim()) {
      setProducts(allProducts)
      return
    }

    const terms = query.toLowerCase().trim().split(/\s+/)
    const filtered = (allProducts || []).filter((p) => {
      const searchText = `${p.title || ''} ${p.description || ''}`.toLowerCase()
      return terms.every(term => searchText.includes(term))
    })
    setProducts(filtered)
  }, [query, allProducts])

  if (loading) return (
    <Container maxW="container.xl" py={8}>
      <Center>
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    </Container>
  )

  return (
    <Container maxW="container.xl" py={8} pb={{ base: '120px', md: 8 }}>
      <Heading size="xl" mb={6}>Tous les Produits</Heading>
      
      {/* Barre de recherche */}
      <Box mb={6}>
        <InputGroup maxW="720px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher un produit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
          />
          {query && (
            <InputRightElement>
              <IconButton 
                aria-label="clear" 
                icon={<CloseIcon />} 
                size="sm" 
                onClick={() => setQuery('')}
              />
            </InputRightElement>
          )}
        </InputGroup>
      </Box>

      {/* Grille de produits */}
      {products && products.length > 0 ? (
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
            <ProductCard
              key={p.id}
              id={String(p.id)}
              title={p.title || p.name}
              price={p.price ?? p.amount}
              image={p.image_url ?? p.product_image}
            />
          ))}
        </Grid>
      ) : (
        <Center py={12}>
          <Text fontSize="lg" color="gray.600">
            Aucun produit trouvé
          </Text>
        </Center>
      )}
    </Container>
  )
}