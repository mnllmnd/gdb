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
  const [categories, setCategories] = React.useState<any[] | null>(null)
  const [categorizedProducts, setCategorizedProducts] = React.useState<Record<number, any[]>>({})
  const [query, setQuery] = React.useState('')
  const [currentView, setCurrentView] = React.useState<'all' | 'category'>('all')
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [allProducts, setAllProducts] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.products.list(),
          api.categories.list(),
        ])
        if (!mounted) return
        setProducts(productsData || [])
        setAllProducts(productsData || [])
        setCategories(categoriesData || [])

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

      {/* Produits organisés par catégorie */}
      {products && products.length > 0 ? (
        <>
          {/* Produits sans catégorie */}
          { (categorizedProducts[0] || []).length > 0 && (
            <Box mb={8}>
              <Heading size="lg" mb={4}>Autres produits</Heading>
              <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={2}>
                {(categorizedProducts[0] || []).map((p) => (
                  <ProductCard key={p.id} id={String(p.id)} title={p.title || p.name} price={p.price ?? p.amount} image_url={p.image_url ?? p.product_image} />
                ))}
              </Grid>
            </Box>
          )}

          {/* Produits par catégorie */}
         {/* Produits par catégorie */}
{categories && categories.length > 0 && (
  categories
    .filter((c: any) => (categorizedProducts[c.id] || []).length > 0)
    .map((c: any) => (
      <Box
        key={c.id}
        mb={6}
        bg="#a86d4d7f"  // couleur inspirée de l'image
        color="white"    // texte bien lisible
        p={{ base: 4, md: 6 }}
        borderRadius="lg"
      >
        <Heading size="lg" mb={4} textAlign="center">{c.name}</Heading>
        <Grid
          templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }}
          gap={4}
        >
          {(categorizedProducts[c.id] || []).map((p) => (
            <ProductCard
              key={p.id}
              id={String(p.id)}
              title={p.title || p.name}
              price={p.price ?? p.amount}
              image_url={p.image_url ?? p.product_image}
            />
          ))}
        </Grid>
      </Box>
    ))
)}

        </>
      ) : (
        <Center py={12}>
          <Text fontSize="lg" color="gray.600">Aucun produit trouvé</Text>
        </Center>
      )}
    </Container>
  )
}