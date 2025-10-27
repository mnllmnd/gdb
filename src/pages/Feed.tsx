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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Icon
} from '@chakra-ui/react'
import { FaPhotoVideo, FaUserFriends } from 'react-icons/fa'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import ReelGrid from '../components/ReelGrid'
import { Link } from 'react-router-dom'
import ScrollTopButton from '../components/ScrollTopButton'

export default function Feed() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  const [stories, setStories] = React.useState<any[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeStory, setActiveStory] = React.useState<Record<string, any> | null>(null)
  const [activeTab, setActiveTab] = React.useState(0) // Maintenant 0 = Reels, 1 = Personnalisé

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
          <Text>Chargement du fil d'actualité…</Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Box py={6} px={{ base: 3, md: 6 }}>
      <Heading size="lg" mb={4}>Fil d'actualité</Heading>

      {/* Navigation Tabs - Reels en premier */}
      <Tabs 
        variant="enclosed" 
        colorScheme="brand" 
        mb={6}
        onChange={(index) => setActiveTab(index)}
        defaultIndex={0} // Reels par défaut
      >
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FaPhotoVideo} />
              <Text>Reels</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FaUserFriends} />
              <Text>Personnalisé</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Reels Section (MAINTENANT PREMIER ONGLET) */}
          <TabPanel px={0}>
            <Box mb={4}>
              <Heading size="md" mb={4}>Reels populaires</Heading>
              <Text color="gray.600" mb={6}>
                Découvrez les vidéos tendance de nos créateurs
              </Text>
              
              <ReelGrid limit={12} />
              
              <Center mt={8}>
                <Button 
                  as={Link} 
                  to="/reels" 
                  colorScheme="brand" 
                  variant="outline"
                  size="lg"
                >
                  Explorer tous les Reels
                </Button>
              </Center>
            </Box>
          </TabPanel>

          {/* Tab 2: Fil personnalisé (Produits) */}
          <TabPanel px={0}>
            {/* Stories strip - seulement dans l'onglet Personnalisé */}
            {stories && stories.length > 0 && (
              <Box mb={6} p={4} bg="white" borderRadius="lg" shadow="sm">
                <Heading size="md" mb={3}>Vos boutiques</Heading>
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
                          borderColor="brand.500"
                          _hover={{ transform: 'scale(1.1)' }}
                          transition="transform 0.2s"
                        />
                        <Text 
                          fontSize="xs" 
                          textAlign="center" 
                          fontWeight="medium"
                          noOfLines={1}
                          maxW="70px"
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
              <Center py={12} bg="white" borderRadius="lg" shadow="sm">
                <VStack spacing={4}>
                  <Heading size="md">Votre fil est vide</Heading>
                  <Text color="gray.600" textAlign="center">
                    Suivez des boutiques pour voir leurs produits ici.
                  </Text>
                  <Button as={Link} to="/products" colorScheme="brand">
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
                        image_url={p.image_url ?? p.product_image}
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
                    <Button onClick={loadMore} colorScheme="brand" size="lg">
                      Charger plus de produits
                    </Button>
                  </Center>
                )}
              </>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Story modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody py={8}>
            {activeStory && (
              <VStack spacing={4} align="center" textAlign="center">
                <Avatar size="2xl" name={activeStory.name} src={activeStory.logo_url} mb={2} />
                <Heading size="md">{activeStory.name}</Heading>
                <Text color="gray.600">{activeStory.description}</Text>
                <Button 
                  as={Link} 
                  to={`/shop/${activeStory.domain || activeStory.id}`} 
                  colorScheme="brand"
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