import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Heading, Text, SimpleGrid, Spinner, Box } from '@chakra-ui/react'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import BackButton from '../components/BackButton'

export default function ShopView() {
  const { domain } = useParams()
  const [shop, setShop] = useState<any | null>(null)
  const [products, setProducts] = useState<any[] | null>(null)

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
      } catch (err) {
        console.error(err)
        setShop(null)
        setProducts([])
      }
    }
    load()
  }, [domain])

  if (!domain) return <Container py={8}>Nom de boutique manquant</Container>

  return (
    <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton />
      {shop === null ? (
        <Spinner />
      ) : (
        <>
          <Box mb={6}>
            <Heading>{shop.name || shop.domain}</Heading>
            <Text color="gray.600">{shop.description}</Text>
          </Box>

          <Heading size="md" mb={4}>Produits</Heading>
          {products === null && <Spinner />}
          {products !== null && products.length === 0 && <Text>Aucun produit trouvé pour cette boutique.</Text>}
          {products !== null && products.length > 0 && (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {products.map((p) => (
                <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} image={p.image_url} />
              ))}
            </SimpleGrid>
          )}
        </>
      )}
    </Container>
  )
}
