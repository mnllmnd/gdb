import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Container, Heading, Box, Image, Text, Spinner, Center, Button } from '@chakra-ui/react'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import BackButton from '../components/BackButton'

export default function ProductView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const list = await api.products.list()
        if (!mounted) return
        const p = (list || []).find((x: any) => String(x.id) === String(id))
        setProduct(p || null)
      } catch (err) {
        console.error('Failed to load product', err)
        if (mounted) setProduct(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  if (loading) return (
    <Container maxW="container.md" py={8}>
      <Center><Spinner /></Center>
    </Container>
  )

  if (!product) return (
    <Container maxW="container.md" py={8}>
      <Box textAlign="center">
        <Heading size="lg">Produit introuvable</Heading>
        <Text mt={3}>Le produit demandé est introuvable ou a été supprimé.</Text>
        <Button mt={6} onClick={() => navigate(location.state?.from || '/products')}>Retour</Button>
      </Box>
    </Container>
  )

  return (
    <Container maxW="container.md" py={8}>
      <BackButton to={location.state?.from} />
      <Heading mb={4}>{product.title || product.name}</Heading>
      <Box mb={4}>
        <Image src={product.image_url ?? product.product_image} alt={product.title || product.name} maxH="400px" objectFit="cover" borderRadius="md" />
      </Box>
      <Box mb={4}>
        <Text fontSize="xl" fontWeight="700">{Math.floor(product.price)} FCFA</Text>
      </Box>
      {/* Stock detail */}
      <Box mb={4}>
        {typeof product.quantity !== 'undefined' && product.quantity !== null ? (
          product.quantity > 0 ? (
            <Text color="green.600" fontWeight="600">En stock : {product.quantity} unité(s) disponibles</Text>
          ) : (
            <Text color="red.500" fontWeight="700">Rupture de stock</Text>
          )
        ) : null}
      </Box>
      <Box mb={6}>
        <Text>{product.description}</Text>
      </Box>
      <ProductCard
        id={String(product.id)}
        title={product.title || product.name}
        price={product.price ?? product.amount}
        image_url={product.image_url ?? product.product_image}
        quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
      />
    </Container>
  )
}
