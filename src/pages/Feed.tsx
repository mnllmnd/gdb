import React from 'react'
import { 
  Box, 
  Heading, 
  SimpleGrid, 
  Center, 
  Spinner, 
  Text, 
  VStack, 
  HStack, 
  Avatar, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalBody, 
  ModalCloseButton, 
  useDisclosure, 
  Button,
  Icon
} from '@chakra-ui/react'
import { FaUserFriends } from 'react-icons/fa'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import { Link } from 'react-router-dom'
import ScrollTopButton from '../components/ScrollTopButton'
import { useColorModeValue } from '@chakra-ui/react'

export default function Feed() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  const [stories, setStories] = React.useState<any[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeStory, setActiveStory] = React.useState<Record<string, any> | null>(null)

  // CORRECTION : Utilisation correcte de useColorModeValue
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const modalBg = useColorModeValue('white', 'gray.900')
  const modalTextColor = useColorModeValue('gray.800', 'white')

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const token = globalThis.localStorage?.getItem('token') ?? undefined
        const res = await api.feed.list(page, limit, token)
        if (!mounted) return
        setProducts(res.items || [])
        setTotal(res.total || 0)

        // Shops removed - no longer loading followed shops
        if (mounted) setStories([])
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
      <Center py={12} bg={bgColor} minH="100vh">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text color={textColor}>Chargement du fil d'actualité…</Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Box 
      py={6} 
      px={{ base: 3, md: 6 }} 
      minH="100vh"
      bg={bgColor}
      color={textColor}
    >
      <Heading size="lg" mb={4} color={textColor}>Fil d'actualité</Heading>

      {/* Stories strip */}
      {stories && stories.length > 0 && (
        <Box 
          mb={6} 
          p={4} 
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg" 
          shadow="sm"
        >
          <Heading size="md" mb={3} color={textColor}>Vos boutiques suivies</Heading>
          <Box overflowX="auto">
            <HStack spacing={4} px={2}>
              {stories.map((s: any) => (
                <VStack 
                  key={s.id} 
                  onClick={() => openStory(s)} 
                  cursor="pointer"
                  spacing={1}
                  minW="70px"
                >
                  <Avatar 
                    size="md" 
                    name={s.name} 
                    src={s.logo_url} 
                    border="2px solid"
                    borderColor="blue.500" // Couleur fixe pour la bordure
                    _hover={{ transform: 'scale(1.1)' }}
                    transition="transform 0.2s"
                  />
                  <Text 
                    fontSize="xs" 
                    textAlign="center" 
                    fontWeight="medium"
                    noOfLines={1}
                    maxW="70px"
                    color={textColor}
                  >
                    {s.name}
                  </Text>
                </VStack>
              ))}
            </HStack>
          </Box>
        </Box>
      )}

      {/* Products Grid */}
      {(!products || products.length === 0) ? (
        <Center 
          py={12} 
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg" 
          shadow="sm"
        >
          <VStack spacing={4}>
            <Heading size="md" color={textColor}>Votre fil est vide</Heading>
            <Text color={textColor} textAlign="center">
              Suivez des boutiques pour voir leurs produits ici.
            </Text>
            <Button as={Link} to="/products" colorScheme="blue">
              Découvrir des produits
            </Button>
          </VStack>
        </Center>
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
            {products.map((p) => (
              <Box key={p.id}>
                <ProductCard
                  id={String(p.id)}
                  title={p.title || p.name}
                  description={p.description}
                  price={p.price ?? p.amount}
                  originalPrice={p.original_price ?? p.originalPrice}
                  discount={p.discount ?? 0}
                  image_url={p.image_url ?? p.product_image}
                  images={p.images ?? (p.image_url ? [p.image_url] : (p.product_image ? [p.product_image] : []))}
                  shopId={p.shop_id || p.seller_id || p.shopId}
                  quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                  shopName={p.shop_name}
                  shopDomain={p.shop_domain}
                />
              </Box>
            ))}
          </SimpleGrid>

          {products.length < total && (
            <Center mt={8}>
              <Button onClick={loadMore} colorScheme="blue" size="lg">
                Charger plus de produits
              </Button>
            </Center>
          )}
        </>
      )}

      {/* Story modal - CORRECTION */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg} color={modalTextColor}>
          <ModalCloseButton />
          <ModalBody py={8}>
            {activeStory && (
              <VStack spacing={4} align="center" textAlign="center">
                <Avatar size="2xl" name={activeStory.name} src={activeStory.logo_url} mb={2} />
                <Heading size="md" color={modalTextColor}>{activeStory.name}</Heading>
                <Text color={modalTextColor} opacity={0.8}>
                  {activeStory.description}
                </Text>
                <Button 
                  as={Link} 
                  to={`/shop/${activeStory.domain || activeStory.id}`} 
                  colorScheme="blue"
                  mt={4}
                >
                  Visiter la boutique
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ScrollTopButton />
    </Box>
  )
}