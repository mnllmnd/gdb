import React from 'react'
import { Box, Heading, SimpleGrid, Center, Spinner, Text, VStack, HStack, Avatar, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure, Button } from '@chakra-ui/react'
import api from '../services/api'
import ProductCard from '../components/ProductCard'

export default function Feed() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  const [stories, setStories] = React.useState<any[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeStory, setActiveStory] = React.useState<Record<string, any> | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const token = globalThis.localStorage?.getItem('token') ?? undefined
        // Use server-side paginated feed
        const res = await api.feed.list(page, limit, token)
        if (!mounted) return
        setProducts(res.items || [])
        setTotal(res.total || 0)

        // For stories, fetch followed shops (simple strip of logos)
        const shops = await api.shops.following(token)
        if (mounted) setStories(shops || [])
      } catch (err) {
        console.error('Failed to load feed', err)
        if (mounted) {
          setProducts([])
          setStories([])
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [page, limit])

  const openStory = (shop: Record<string, any>) => {
    setActiveStory(shop)
    onOpen()
  }

  const loadMore = () => {
    if (products.length < total) setPage((p) => p + 1)
  }

  if (isLoading) {
    return (
      <Center py={12}>
        <VStack>
          <Spinner size="xl" />
          <Text>Chargement du fil personnalisé…</Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Box py={6} px={{ base: 3, md: 6 }}>
      <Heading size="lg" mb={4}>Fil personnalisé</Heading>

      {/* Stories strip */}
      {stories && stories.length > 0 && (
        <Box mb={4} overflowX="auto">
          <HStack spacing={3} px={2}>
            {stories.map((s: any) => (
              <Box key={s.id} onClick={() => openStory(s)} cursor="pointer">
                <Avatar size="md" name={s.name} src={s.logo_url} />
                <Text fontSize="xs" textAlign="center" mt={1}>{s.name}</Text>
              </Box>
            ))}
          </HStack>
        </Box>
      )}

      {(!products || products.length === 0) ? (
        <Center py={12}>
          <VStack>
            <Heading size="md">Votre fil est vide</Heading>
            <Text>Suivez des boutiques pour voir leurs produits ici.</Text>
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
          {products.map((p) => (
            <Box key={p.id}>
              <ProductCard
                id={String(p.id)}
                title={p.title || p.name}
                description={p.description}
                price={p.price ?? p.amount}
                image_url={p.image_url ?? p.product_image}
                shopId={p.shop_id || p.seller_id || p.shopId}
                quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                shopName={p.shop_name}
                shopDomain={p.shop_domain}
              />
            </Box>
          ))}
        </SimpleGrid>
      )}

      {products.length < total && (
        <Center mt={6}>
          <Button onClick={loadMore} colorScheme="brand">Charger plus</Button>
        </Center>
      )}

      {/* Story modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            {activeStory && (
              <VStack spacing={4} align="stretch">
                <Avatar size="2xl" name={activeStory.name} src={activeStory.logo_url} mb={2} />
                <Heading size="md">{activeStory.name}</Heading>
                <Text>{activeStory.description}</Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
