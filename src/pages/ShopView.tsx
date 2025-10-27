import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Container, Heading, Text, Spinner, Box, useBreakpointValue, Grid, GridItem, VStack } from '@chakra-ui/react'
import api from '../services/api'
import FollowButton from '../components/FollowButton'
import ProductCard from '../components/ProductCard'
import BackButton from '../components/BackButton'

interface Category { id: number; name: string }

export default function ShopView() {
  const { domain } = useParams()
  const location = useLocation()
  const [shop, setShop] = useState<Record<string, any> | null>(null)
  const [products, setProducts] = useState<any[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categorizedProducts, setCategorizedProducts] = useState<Record<number, any[]>>({})
  const cardHeight = useBreakpointValue({ base: '90px', md: '180px' })

  useEffect(() => {
    async function load() {
      try {
        if (!domain) return
        const s = await api.shops.byDomain(domain)
        setShop(s)

        // Try a dedicated endpoint first, fall back to filtering products list
        let found: any[] = []
        try {
          const all = await api.products.list()
          // backend returns seller_id and image_url fields
          found = Array.isArray(all) ? all.filter((p: any) => String(p.seller_id) === String(s.owner_id) || String(p.shop_id) === String(s.id)) : []
        } catch (error_) {
          console.warn('Failed to load shop-specific products, falling back', error_)
          found = []
        }

        setProducts(found)

        try {
          const cats = await api.categories.list()
          setCategories(cats || [])
        } catch (err) {
          console.warn('Failed to load categories for shop view', err)
          setCategories([])
        }
      } catch (err) {
        console.error(err)
        setShop(null)
        setProducts([])
      }
    }
    load()
  }, [domain])

  useEffect(() => {
    const map: Record<number, any[]> = {}
    const list = products || []
    for (const p of list) {
      const cid = p.category_id ?? 0
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    }
    setCategorizedProducts(map)
  }, [products])

  if (!domain) return <Container py={8}>Nom de boutique manquant</Container>

  return (
    <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton to={location.state?.from} />
      {shop === null ? (
        <Spinner />
      ) : (
        <>
          <Box mb={6} display="flex" alignItems="center" justifyContent="space-between">
            <div>
              <Heading>{shop.name || shop.domain}</Heading>
              <Text color="white">{shop.description}</Text>
            </div>
            <div>
              <FollowButton id={String(shop.id)} />
            </div>
          </Box>

          <Heading size="md" mb={4}>Produits</Heading>
          {products === null && <Spinner />}
          {products !== null && products.length === 0 && <Text>Aucun produit trouvé pour cette boutique.</Text>}
          {products !== null && products.length > 0 && (
            <VStack spacing={8} align="stretch">
              {/* Uncategorized */}
              {(() => {
                const uncategorized = (products || []).filter(p => !p.category_id)
                if (uncategorized.length === 0) return null
                return (
                  <Box mb={8} bg="brand.700" p={{ base: 4, md: 6 }} borderRadius="lg">
                    <Heading size="lg" mb={4} color="white" textAlign="center">Autres produits</Heading>
                    <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={2}>
                      {uncategorized.map((product) => (
                        <GridItem key={product.id}>
                          <ProductCard
                            id={String(product.id)}
                            title={product.title || product.name || ''}
                            price={product.price ?? product.amount}
                            image_url={product.image_url ?? product.product_image}
                            quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
                            height={cardHeight}
                          />
                        </GridItem>
                      ))}
                    </Grid>
                  </Box>
                )
              })()}

              {/* Per-category sections */}
              {categories
                .filter(category => (categorizedProducts[category.id] || []).length > 0)
                .map(category => (
                  <Box key={category.id} bg="#9d7b6a77" color="white" p={{ base: 4, md: 6 }} borderRadius="lg" mb={6}>
                    <Heading size="lg" mb={4} textAlign="center" color="white">{category.name}</Heading>
                    <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={4}>
                      {(categorizedProducts[category.id] || []).map((product) => (
                        <GridItem key={product.id}>
                          <ProductCard
                            id={String(product.id)}
                            title={product.title || product.name || ''}
                            price={product.price ?? product.amount}
                            image_url={product.image_url ?? product.product_image}
                            quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
                            height={cardHeight}
                          />
                        </GridItem>
                      ))}
                    </Grid>
                  </Box>
                ))}
            </VStack>
          )}
        </>
      )}
    </Container>
  )
}
