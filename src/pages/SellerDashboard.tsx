import React, { useEffect, useState } from 'react'
import { Container, Heading, Text, Button, Stack, Box, Image, Flex, Spacer, IconButton, Spinner, useBreakpointValue } from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { highRes, PRODUCT_PLACEHOLDER, SHOP_PLACEHOLDER } from '../utils/image'
import { getItem } from '../utils/localAuth'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'

export default function SellerDashboard() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Record<string, any>[]>([])
  const [shop, setShop] = useState<Record<string, any> | null>(null)
  const user = getItem('user') ? JSON.parse(getItem('user') as string) : null
  const btnSize = useBreakpointValue({ base: 'sm', md: 'md' })

  useEffect(() => {
    let mounted = true
    api.products.list().then((list: any[]) => {
      if (!mounted) return
      const mine = user ? list.filter((p) => String(p.seller_id) === String(user.id)) : []
      setProducts(mine)
    }).catch((e) => console.error(e)).finally(() => setLoading(false));
    // fetch seller shop
    (async () => {
      try {
        const token = getItem('token')
        const s = await api.shops.me(token ?? undefined)
        if (mounted) setShop(s)
      } catch (err) {
          console.error('Failed to fetch shop', err)
          if (mounted) setShop(null)
        }
    })()
    return () => { mounted = false }
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      const token = getItem('token')
      await api.products.delete(id, token ?? undefined)
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)))
    } catch (err) {
      console.error(err)
      alert('Impossible de supprimer')
    }
  }

  async function handleDeleteShop() {
    if (!confirm('Supprimer votre boutique et toutes ses données ?')) return
    try {
      const token = getItem('token')
      const s = await api.shops.me(token ?? undefined)
      await api.shops.delete(s.id, token ?? undefined)
      // reload page
      globalThis.location.href = '/seller/setup'
    } catch (err) {
      console.error(err)
      alert('Impossible de supprimer la boutique')
    }
  }

  return (
  <Container maxW="container.md" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton />
      <Heading mb={4}>Tableau de bord vendeur</Heading>
      <Text mb={6}>Gérez vos produits et suivez les commandes.</Text>
      {/* Responsive action buttons: stacked on mobile to avoid overlap */}
  <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 3, md: 4 }} mb={6}>
        {/* smaller size on mobile, full width */}
  <Button colorScheme="teal" onClick={() => nav('/seller/setup')} size={btnSize} width={{ base: '100%', md: 'auto' }}>
          {shop ? 'Modifier ma boutique' : 'Configurer ma boutique'}
        </Button>
  <Button onClick={() => nav('/seller/product')} size={btnSize} width={{ base: '100%', md: 'auto' }}>
          Ajouter un produit
        </Button>
        {shop && (
          <Button variant="outline" onClick={() => nav('/seller/shop')} size={btnSize} width={{ base: '100%', md: 'auto' }}>
            Accéder à mon shop
          </Button>
        )}
        {shop && (
          <Button colorScheme="red" onClick={handleDeleteShop} size={btnSize} width={{ base: '100%', md: 'auto' }}>
            Supprimer la boutique
          </Button>
        )}
      </Stack>

      {loading ? <Spinner /> : (
        <>
          {shop && (
            <Box borderWidth="1px" p={4} mb={4} borderRadius="md">
              <Flex align="center">
                  <Image src={highRes(shop.logo_url) ?? SHOP_PLACEHOLDER} boxSize={{ base: '56px', md: '80px' }} objectFit="cover" borderRadius="md" mr={4}
                    onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
                  />
                <Box>
                  <Heading size="sm">{shop.name ?? 'Ma boutique'}</Heading>
                  <Text>{shop.description}</Text>
                  <Text fontSize="sm" color="white">Domaine: {shop.domain ?? '—'}</Text>
                </Box>
                <Spacer />
              </Flex>
            </Box>
          )}
          {products.length === 0 ? <Text>Aucun produit trouvé.</Text> : (
          <Stack spacing={4}>
            {products.map((p) => (
              <Box key={p.id} borderRadius="xl" p={4} bg="white" boxShadow="sm" borderWidth="1px">
                <Flex align="center">
                  <Box boxSize={{ base: '80px', md: '110px' }} mr={4} display="flex" alignItems="center" justifyContent="center" bg="gray.50" borderRadius="md" overflow="hidden">
                    <Image src={highRes(p.image_url, { width: 400, quality: 80 }) ?? PRODUCT_PLACEHOLDER} maxH="100%" maxW="100%" objectFit="cover" />
                  </Box>
                  <Box>
                    <Heading size="sm" noOfLines={2}>{p.title}</Heading>
                    <Text noOfLines={2} color="gray.600">{p.description}</Text>
                    <Text fontWeight="bold" mt={2}>{p.price} FCFA</Text>
                  </Box>
                  <Spacer />
                  <Stack direction="row">
                    <IconButton aria-label="edit" icon={<EditIcon />} onClick={() => nav(`/seller/product/${p.id}`)} variant="ghost" />
                    <IconButton aria-label="delete" icon={<DeleteIcon />} onClick={() => handleDelete(String(p.id))} colorScheme="red" />
                  </Stack>
                </Flex>
              </Box>
            ))}
          </Stack>
          )}
        </>
      )}
    </Container>
  )
}
