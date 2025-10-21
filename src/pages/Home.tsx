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
  // Ensure we have at least one of title or name
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

export default function Home() {
  const [shops, setShops] = React.useState<Shop[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [categorizedProducts, setCategorizedProducts] = React.useState<Record<number, Product[]>>({})
  const [query, setQuery] = React.useState('')
  const [currentView, setCurrentView] = React.useState<'shops' | 'products'>('shops')
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const cardHeight = useBreakpointValue({ base: '90px', md: '180px' })

  // Chargement initial des données
  React.useEffect(() => {
    async function loadData() {
      try {
        const [shopsData, categoriesData, productsData] = await Promise.all([
          api.shops.list(),
          api.categories.list(),
          api.products.list(),
        ])
        
        setShops(shopsData)
        setCategories(categoriesData)
        setProducts(productsData)
        
        // Organiser les produits par catégorie
        const productsByCategory: Record<number, Product[]> = {}
        
        productsData?.forEach((product: Product) => {
          if (!product?.id) return
          
          const categoryId = product.category_id ?? 0
          if (!productsByCategory[categoryId]) {
            productsByCategory[categoryId] = []
          }
          productsByCategory[categoryId].push(product)
        })
        
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

  // Recherche avec debounce
  React.useEffect(() => {
    if (!query.trim()) return

    const searchData = async () => {
      setIsLoading(true)
      try {
        if (currentView === 'shops') {
          const results = await api.shops.search(query.trim())
          setShops(results)
        } else {
          const allProducts = await api.products.list()
          const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
          
          const filteredProducts = allProducts?.filter((product: Product) => {
            const searchText = `${product.title || product.name || ''} ${product.description || ''}`.toLowerCase()
            return searchTerms.every(term => searchText.includes(term))
          }) || []

          setProducts(filteredProducts)
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(searchData, 300)
    return () => clearTimeout(timeoutId)
  }, [query, currentView])

  // Recompute categorizedProducts whenever `products` changes
  React.useEffect(() => {
    const map: Record<number, Product[]> = {}
    products.forEach((p) => {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    })
    setCategorizedProducts(map)
  }, [products])

  // Rechargement des données quand la recherche est vide ou la vue change
  React.useEffect(() => {
    if (query.trim()) return

    let isMounted = true

    const reloadData = async () => {
      setIsLoading(true)
      try {
        if (currentView === 'shops') {
          const shopsData = await api.shops.list()
          if (isMounted) setShops(shopsData)
        } else {
          const productsData = await api.products.list()
          if (isMounted) setProducts(productsData?.slice(0, 12) || [])
        }
      } catch (err) {
        console.error('Reload failed', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    reloadData()
    return () => { isMounted = false }
  }, [query, currentView])

  const renderShopsView = () => {
    if (!shops?.length) {
      return query ? (
        <NoResults message="Aucune boutique ne correspond à votre recherche" onClear={() => setQuery('')} />
      ) : null
    }

    return (
      <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2}>
        {shops.map((shop) => (
          <GridItem key={shop.id}>
            <ShopCard {...shop} id={String(shop.id)} compact height={cardHeight} />
          </GridItem>
        ))}
      </Grid>
    )
  }

  const renderProductsView = () => {
    if (!products?.length) {
      return query ? (
        <NoResults message="Aucun produit ne correspond à votre recherche" onClear={() => setQuery('')} />
      ) : null
    }

    return (
      <VStack spacing={8} align="stretch">
        {selectedCategory === null ? (
          <>
            {/* Produits sans catégorie */}
            {renderUncategorizedProducts()}
            
            {/* Produits par catégorie */}
            {categories
              .filter(category => (categorizedProducts[category.id] || []).length > 0)
              .map(category => renderProductCategory(category))}
          </>
        ) : (
          /* Produits d'une catégorie spécifique */
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={2}>
            {(categorizedProducts[selectedCategory] || []).map((product) => (
                <GridItem key={product.id}>
                  <ProductCard
                    id={String(product.id)}
                    title={product.title || product.name || ''}
                    price={product.price ?? product.amount}
                    image_url={product.image_url ?? product.product_image}
                    height={cardHeight}
                  />
                </GridItem>
            ))}
          </Grid>
        )}
      </VStack>
    )
  }

  const renderUncategorizedProducts = () => {
    const uncategorizedProducts = products?.filter(product => !product.category_id) || []
    
    if (uncategorizedProducts.length === 0) return null

    return (
      <Box mb={8}>
        <Heading size="lg" mb={4}>Autres produits</Heading>
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={2}>
          {uncategorizedProducts.map((product) => (
              <GridItem key={product.id}>
                <ProductCard
                  id={String(product.id)}
                  title={product.title || product.name || ''}
                  price={product.price ?? product.amount}
                  image_url={product.image_url ?? product.product_image}
                  height={cardHeight}
                />
              </GridItem>
          ))}
        </Grid>
      </Box>
    )
  }

  const renderProductCategory = (category: Category) => {
    const categoryProducts = categorizedProducts[category.id] || []
    
    // Ne pas afficher les catégories vides lors d'une recherche
    if (query && categoryProducts.length === 0) return null

    return (
      <Box key={category.id} bg="gray.50" p={{ base: 4, md: 6 }} borderRadius="lg" mb={6}>
        <Heading size="lg" mb={4} textAlign="center">{category.name}</Heading>
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={4}>
          {categoryProducts.map((product) => (
              <GridItem key={product.id}>
                <ProductCard
                  id={String(product.id)}
                  title={product.title || product.name || ''}
                  price={product.price ?? product.amount}
                  image_url={product.image_url ?? product.product_image}
                  height={cardHeight}
                />
              </GridItem>
          ))}
        </Grid>
      </Box>
    )
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="brand.500" color="white" py={16} position="relative" overflow="hidden">
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
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Heading size="2xl" mb={4}>
                {currentView === 'shops' ? 'Découvrez nos boutiques' : 'Produits récents'}
              </Heading>
              <Text fontSize="xl" color="whiteAlpha.900">
                {currentView === 'shops' 
                  ? 'Les meilleurs produits, directement des artisans' 
                  : 'Explorez les produits disponibles'
                }
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Navigation et filtres */}
      <FilterNav 
        view={currentView} 
        onViewChange={setCurrentView} 
        searchQuery={query} 
        onSearchChange={setQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Contenu principal */}
      <Container maxW={{ base: '95%', md: '85%', lg: '80%' }} py={4}>
        {isLoading ? (
          <Center py={4}><Spinner size="md" /></Center>
        ) : (
          currentView === 'shops' ? renderShopsView() : renderProductsView()
        )}
      </Container>
    </Box>
  )
}

// Composant pour les résultats vides
function NoResults({ message, onClear }: { message: string; onClear: () => void }) {
  return (
    <Box textAlign="center" py={8}>
      <Text fontSize="lg" mb={4}>{message}</Text>
      <IconButton
        aria-label="Effacer la recherche"
        icon={<CloseIcon />}
        onClick={onClear}
        size="md"
        colorScheme="brand"
        variant="outline"
      />
    </Box>
  )
}

// Composant pour l'aperçu des produits (gardé pour référence)
function ProductListPreview({ cardHeight }: { cardHeight?: any }) {
  const [products, setProducts] = React.useState<Product[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true
    
    const loadProducts = async () => {
      try {
        const productsList = await api.products.list()
        if (isMounted) {
          setProducts(productsList?.slice(0, 8) || [])
        }
      } catch (err) {
        console.error('Failed to load products', err)
        if (isMounted) setProducts([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    loadProducts()
    return () => { isMounted = false }
  }, [])

  if (loading) return <Box><Text>Chargement...</Text></Box>
  if (!products || products.length === 0) return <Box><Text>Aucun produit récent.</Text></Box>

  return (
    <Box>
      <Grid 
        templateColumns={{ 
          base: 'repeat(auto-fill, minmax(140px, 1fr))', 
          sm: 'repeat(auto-fill, minmax(160px, 1fr))', 
          md: 'repeat(auto-fill, minmax(200px, 1fr))' 
        }} 
        gap={{ base: 4, sm: 5, md: 6 }}
      >
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            id={String(product.id)} 
            title={product.title || product.name} 
            price={product.price ?? product.amount} 
            image_url={product.image_url ?? product.product_image} 
            height={cardHeight} 
          />
        ))}
      </Grid>
    </Box>
  )
}