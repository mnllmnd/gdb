import React, { useEffect, useState } from 'react'
import {
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Box,
  Image,
  Flex,
  Spacer,
  IconButton,
  Spinner,
  useBreakpointValue,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react'
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

  const bgCard = useColorModeValue('#d4b4a68f', 'gray.800')
  const bgItem = useColorModeValue('white', 'gray.700')
  const headingColor = useColorModeValue('black', 'white') // <— toujours visible
  const textMuted = useColorModeValue('gray.700', 'gray.400') // un peu plus sombre

  useEffect(() => {
    let mounted = true

    api.products
      .list()
      .then((list: any[]) => {
        if (!mounted) return
        const mine = user ? list.filter((p) => String(p.seller_id) === String(user.id)) : []
        setProducts(mine)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))

    ;(async () => {
      try {
        const token = getItem('token')
        const s = await api.shops.me(token ?? undefined)
        if (mounted) setShop(s)
      } catch (err) {
        console.error('Failed to fetch shop', err)
        if (mounted) setShop(null)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      const token = getItem('token')
      await api.products.delete(id, token ?? undefined)
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)))
    } catch (err) {
      console.error(err)
      alert('Impossible de supprimer le produit')
    }
  }

  async function handleDeleteShop() {
    if (!confirm('Supprimer votre boutique et toutes ses données ?')) return
    try {
      const token = getItem('token')
      const s = await api.shops.me(token ?? undefined)
      await api.shops.delete(s.id, token ?? undefined)
      globalThis.location.href = '/seller/setup'
    } catch (err) {
      console.error(err)
      alert('Impossible de supprimer la boutique')
    }
  }

  return (
    <Container maxW="container.lg" py={10}>
      <BackButton />

      <Box
        bg={bgCard}
        p={8}
        rounded="2xl"
        shadow="xl"
        backdropFilter="blur(8px)"
        transition="all 0.3s ease"
        _hover={{ transform: 'translateY(-3px)', shadow: '2xl' }}
      >
        <Heading mb={4} textAlign="center" color={headingColor} fontWeight="semibold">
          Tableau de bord vendeur
        </Heading>
        <Text mb={6} textAlign="center" color={textMuted}>
          Gérez vos produits, votre boutique et vos informations.
        </Text>

        <Divider mb={6} />

        {/* Boutons d'action */}
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: 3, md: 4 }}
          mb={8}
          justify="center"
        >
          <Button
            colorScheme="blue"
            onClick={() => nav('/seller/setup')}
            size={btnSize}
            w={{ base: '100%', md: 'auto' }}
          >
            {shop ? 'Modifier ma boutique' : 'Configurer ma boutique'}
          </Button>

          <Button
            colorScheme="teal"
            onClick={() => nav('/seller/product')}
            size={btnSize}
            w={{ base: '100%', md: 'auto' }}
          >
            Ajouter un produit
          </Button>

          {shop && (
            <Button
              variant="outline"
              onClick={() => nav('/seller/shop')}
              size={btnSize}
              w={{ base: '100%', md: 'auto' }}
            >
              Voir ma boutique
            </Button>
          )}

          {shop && (
            <Button
              colorScheme="red"
              onClick={handleDeleteShop}
              size={btnSize}
              w={{ base: '100%', md: 'auto' }}
            >
              Supprimer la boutique
            </Button>
          )}
        </Stack>

        {/* Contenu principal */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : (
          <>
            {shop && (
              <Box
                bg={bgItem}
                borderRadius="xl"
                p={5}
                mb={8}
                shadow="md"
                transition="all 0.2s ease"
                _hover={{ shadow: 'lg' }}
              >
                <Flex align="center">
                  <Image
                    src={highRes(shop.logo_url) ?? SHOP_PLACEHOLDER}
                    boxSize={{ base: '64px', md: '90px' }}
                    objectFit="cover"
                    borderRadius="lg"
                    mr={5}
                    border="1px solid #ccc"
                    onError={(e: any) => {
                      e.currentTarget.src = SHOP_PLACEHOLDER
                    }}
                  />
                  <Box>
                    <Heading size="sm" color={headingColor}>
                      {shop.name ?? 'Ma boutique'}
                    </Heading>
                    <Text color={textMuted}>{shop.description || 'Aucune description'}</Text>
                    <Text fontSize="sm" color="gray.500">
                      🌐 Domaine : <strong>{shop.domain ?? '—'}</strong>
                    </Text>
                  </Box>
                </Flex>
              </Box>
            )}

            {/* Liste des produits */}
            {products.length === 0 ? (
              <Text textAlign="center" color={textMuted}>
                Aucun produit ajouté pour le moment.
              </Text>
            ) : (
              <Stack spacing={5}>
                {products.map((p) => (
                  <Box
                    key={p.id}
                    bg={bgItem}
                    p={4}
                    borderRadius="xl"
                    shadow="sm"
                    borderWidth="1px"
                    transition="all 0.2s ease"
                    _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                  >
                    <Flex align="center">
                      <Box
                        boxSize={{ base: '80px', md: '100px' }}
                        mr={4}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="gray.50"
                        borderRadius="md"
                        overflow="hidden"
                      >
                        <Image
                          src={highRes(p.image_url, { width: 400, quality: 80 }) ?? PRODUCT_PLACEHOLDER}
                          alt={p.title}
                          objectFit="cover"
                          maxW="100%"
                          maxH="100%"
                        />
                      </Box>

                      <Box flex="1">
                        <Heading size="sm" color="black" noOfLines={1}>
                          {p.title}
                        </Heading>
                        <Text noOfLines={2} color={textMuted}>
                          {p.description}
                        </Text>

                        <Box
                          bg="green.50"
                          display="inline-block"
                          px={2}
                          py={1}
                          borderRadius="md"
                          mt={2}
                        >
                          <Text fontSize="md" color="green.700" fontWeight="bold">
                            {Math.floor(p.price)} FCFA
                          </Text>
                        </Box>
                      </Box>

                      <Spacer />
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          aria-label="Modifier"
                          icon={<EditIcon />}
                          onClick={() => nav(`/seller/product/${p.id}`)}
                          variant="ghost"
                        />
                        <IconButton
                          aria-label="Supprimer"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="solid"
                          onClick={() => handleDelete(String(p.id))}
                        />
                      </Stack>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Container>
  )
}
