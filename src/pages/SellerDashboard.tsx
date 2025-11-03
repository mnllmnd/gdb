import React, { useEffect, useState } from 'react'
import {
  Container,
  Heading,
  Text,
  Button,
  Box,
  Image,
  Flex,
  IconButton,
  Spinner,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Icon,
  Card,
  CardBody,
  SimpleGrid,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Avatar,
} from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { highRes, PRODUCT_PLACEHOLDER, SHOP_PLACEHOLDER } from '../utils/image'
import { getItem } from '../utils/localAuth'
import { 
  FiPackage, 
  FiShoppingBag, 
  FiSettings, 
  FiTrash2, 
  FiEdit2, 
  FiPlus, 
  FiEye, 
  FiBarChart2,
  FiActivity,
  FiTrendingUp,
  FiLayers,
  FiHome,
  FiUsers
} from 'react-icons/fi'

export default function SellerDashboard() {
  const nav = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Record<string, any>[]>([])
  const [shop, setShop] = useState<Record<string, any> | null>(null)
  const user = getItem('user') ? JSON.parse(getItem('user') as string) : null

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const headingColor = useColorModeValue('gray.800', 'white')
  const textMuted = useColorModeValue('gray.600', 'gray.400')

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
      toast({
        title: '✅ Produit supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function handleDeleteShop() {
    if (!confirm('Supprimer votre boutique et toutes ses données ? Cette action est irréversible.')) return
    try {
      const token = getItem('token')
      const s = await api.shops.me(token ?? undefined)
      await api.shops.delete(s.id, token ?? undefined)
      toast({
        title: 'Boutique supprimée',
        status: 'success',
        duration: 3000,
      })
      globalThis.location.href = '/seller/setup'
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la boutique',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Statistiques simulées
  const stats = {
    totalProducts: products.length,
    totalViews: 0,
    totalSales: 0,
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.lg" py={4} pb={{ base: '100px', md: 8 }}>
        <BackButton />

        {/* Header simplifié */}
        <Card mb={4} bg={cardBg} borderRadius="xl" shadow="sm">
          <CardBody p={4}>
            <VStack spacing={3} align="stretch">
              <HStack spacing={3}>
                <Icon as={FiShoppingBag} boxSize={6} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={headingColor}>
                    Tableau de bord
                  </Heading>
                  <Text color={textMuted} fontSize="sm">
                    {shop ? shop.name : 'Votre activité'}
                  </Text>
                </VStack>
              </HStack>

              {/* Stats rapides */}
              <SimpleGrid columns={4} spacing={2}>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="800" color="blue.700">
                    {stats.totalProducts}
                  </Text>
                  <Text fontSize="2xs" color="blue.600">
                    Produits
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="800" color="green.700">
                    {stats.totalSales}
                  </Text>
                  <Text fontSize="2xs" color="green.600">
                    Ventes
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="800" color="purple.700">
                    {stats.totalViews}
                  </Text>
                  <Text fontSize="2xs" color="purple.600">
                    Vues
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Navigation tabs mobile optimisée */}
        <Tabs variant="soft-rounded" colorScheme="blue" isFitted>
          <TabList mb={4} bg="white" p={1} borderRadius="xl" shadow="sm">
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiBarChart2} boxSize={4} />
                <Text fontSize="2xs">Vue</Text>
              </VStack>
            </Tab>
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiHome} boxSize={4} />
                <Text fontSize="2xs">Boutique</Text>
              </VStack>
            </Tab>
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiPackage} boxSize={4} />
                <Text fontSize="2xs">Produits</Text>
              </VStack>
            </Tab>
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiSettings} boxSize={4} />
                <Text fontSize="2xs">Actions</Text>
              </VStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Vue d'ensemble mobile */}
            <TabPanel p={0}>
              <VStack spacing={4} align="stretch">
                {/* Aperçu rapide */}
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Icon as={FiActivity} color="blue.500" />
                        <Text fontWeight="600">Aperçu</Text>
                      </HStack>
                      
                      <SimpleGrid columns={2} spacing={3}>
                        <Box p={3} bg="blue.50" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="600" color="blue.700">
                            {products.length} produit{products.length > 1 ? 's' : ''}
                          </Text>
                          <Text fontSize="xs" color="blue.600">
                            {products.length > 0 ? '🟢 En ligne' : '🔴 Aucun'}
                          </Text>
                        </Box>
                        <Box p={3} bg="green.50" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="600" color="green.700">
                            {shop ? 'Active' : 'Inactive'}
                          </Text>
                          <Text fontSize="xs" color="green.600">
                            {shop ? '🟢 Boutique' : '🔴 À créer'}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Accès rapide */}
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Icon as={FiLayers} color="purple.500" />
                        <Text fontWeight="600">Actions rapides</Text>
                      </HStack>
                      
                      <VStack spacing={2}>
                        <Button
                          leftIcon={<Icon as={FiPlus} />}
                          colorScheme="blue"
                          onClick={() => nav('/seller/product')}
                          w="100%"
                          size="sm"
                        >
                          Ajouter produit
                        </Button>
                        <Button
                          leftIcon={<Icon as={FiSettings} />}
                          variant="outline"
                          onClick={() => nav('/seller/setup')}
                          w="100%"
                          size="sm"
                        >
                          {shop ? 'Modifier boutique' : 'Créer boutique'}
                        </Button>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Activité récente */}
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Icon as={FiTrendingUp} color="green.500" />
                        <Text fontWeight="600">Activité récente</Text>
                      </HStack>
                      
                      <VStack spacing={2} align="stretch">
                        {products.slice(0, 2).map((product, index) => (
                          <HStack key={product.id} p={2} bg="gray.50" borderRadius="md">
                            <Avatar 
                              size="sm" 
                              src={highRes(product.image_url) ?? PRODUCT_PLACEHOLDER}
                              name={product.title}
                            />
                            <Box flex={1}>
                              <Text fontWeight="600" fontSize="xs" noOfLines={1}>
                                {product.title}
                              </Text>
                              <Text fontSize="2xs" color={textMuted}>
                                {Math.floor(product.price)} FCFA
                              </Text>
                            </Box>
                          </HStack>
                        ))}
                        {products.length === 0 && (
                          <Text color={textMuted} fontSize="sm" textAlign="center" py={2}>
                            Aucune activité
                          </Text>
                        )}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Tab 2: Ma boutique mobile */}
            <TabPanel p={0}>
              {shop ? (
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiHome} color="purple.500" />
                          <Text fontWeight="600">Ma boutique</Text>
                        </HStack>
                        <Badge colorScheme="green" fontSize="xs">
                          Active
                        </Badge>
                      </HStack>

                      <VStack spacing={3}>
                        <Image
                          src={highRes(shop.logo_url) ?? SHOP_PLACEHOLDER}
                          boxSize="100px"
                          objectFit="cover"
                          borderRadius="xl"
                          border="2px solid"
                          borderColor="gray.200"
                        />
                        
                        <VStack spacing={1}>
                          <Text fontWeight="700" fontSize="lg" textAlign="center">
                            {shop.name}
                          </Text>
                          <Text color={textMuted} fontSize="sm" textAlign="center" noOfLines={2}>
                            {shop.description || 'Aucune description'}
                          </Text>
                          <Badge colorScheme="purple" fontSize="xs">
                            {shop.domain || 'Aucun domaine'}
                          </Badge>
                        </VStack>
                      </VStack>

                      <SimpleGrid columns={2} spacing={2} pt={2}>
                        <Button
                          leftIcon={<Icon as={FiEdit2} />}
                          colorScheme="blue"
                          onClick={() => nav('/seller/setup')}
                          size="sm"
                        >
                          Modifier
                        </Button>
                        <Button
                          leftIcon={<Icon as={FiEye} />}
                          variant="outline"
                          onClick={() => nav('/seller/shop')}
                          size="sm"
                        >
                          Voir
                        </Button>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>
              ) : (
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={8} textAlign="center">
                    <Icon as={FiHome} boxSize={8} color="gray.400" mb={3} />
                    <Text fontWeight="600" color={textMuted} mb={2}>
                      Aucune boutique
                    </Text>
                    <Text color={textMuted} fontSize="sm" mb={4}>
                      Créez votre boutique pour commencer
                    </Text>
                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FiPlus} />}
                      onClick={() => nav('/seller/setup')}
                      size="sm"
                    >
                      Créer boutique
                    </Button>
                  </CardBody>
                </Card>
              )}
            </TabPanel>

            {/* Tab 3: Mes produits mobile */}
            <TabPanel p={0}>
              {products.length === 0 ? (
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={8} textAlign="center">
                    <Icon as={FiPackage} boxSize={8} color="gray.400" mb={3} />
                    <Text fontWeight="600" color={textMuted} mb={2}>
                      Aucun produit
                    </Text>
                    <Text color={textMuted} fontSize="sm" mb={4}>
                      Ajoutez votre premier produit
                    </Text>
                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FiPlus} />}
                      onClick={() => nav('/seller/product')}
                      size="sm"
                    >
                      Ajouter produit
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                <VStack spacing={3} align="stretch">
                  {products.map((p) => (
                    <Card
                      key={p.id}
                      bg={cardBg}
                      borderRadius="xl"
                      shadow="sm"
                      transition="all 0.2s"
                      _active={{ transform: 'scale(0.98)' }}
                    >
                      <CardBody p={3}>
                        <HStack spacing={3} align="start">
                          {/* Image produit */}
                          <Box
                            boxSize="60px"
                            bg="white"
                            borderRadius="lg"
                            overflow="hidden"
                            border="1px solid"
                            borderColor="gray.200"
                            flexShrink={0}
                          >
                            <Image
                              src={highRes(p.image_url) ?? PRODUCT_PLACEHOLDER}
                              alt={p.title}
                              objectFit="cover"
                              w="100%"
                              h="100%"
                            />
                          </Box>

                          {/* Infos produit */}
                          <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                              {p.title}
                            </Text>
                            <Text color={textMuted} fontSize="xs" noOfLines={1}>
                              {p.description || 'Aucune description'}
                            </Text>
                            
                            <HStack spacing={2}>
                              <Badge colorScheme="green" fontSize="xs">
                                {Math.floor(p.price)} FCFA
                              </Badge>
                              {p.quantity > 0 ? (
                                <Badge colorScheme="blue" fontSize="xs">
                                  {p.quantity} en stock
                                </Badge>
                              ) : (
                                <Badge colorScheme="red" fontSize="xs">
                                  Rupture
                                </Badge>
                              )}
                            </HStack>
                          </VStack>

                          {/* Actions */}
                          <VStack spacing={1}>
                            <IconButton
                              aria-label="Modifier"
                              icon={<Icon as={FiEdit2} />}
                              onClick={() => nav(`/seller/product/${p.id}`)}
                              variant="ghost"
                              colorScheme="blue"
                              size="sm"
                              boxSize={8}
                            />
                            <IconButton
                              aria-label="Supprimer"
                              icon={<Icon as={FiTrash2} />}
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDelete(String(p.id))}
                              size="sm"
                              boxSize={8}
                            />
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Tab 4: Actions mobile */}
            <TabPanel p={0}>
              <VStack spacing={3} align="stretch">
                {/* Créer/Modifier boutique */}
                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  shadow="sm"
                  onClick={() => nav('/seller/setup')}
                  cursor="pointer"
                  transition="all 0.2s"
                  _active={{ transform: 'scale(0.98)' }}
                >
                  <CardBody p={4}>
                    <HStack spacing={3}>
                      <Icon as={shop ? FiSettings : FiPlus} boxSize={5} color="blue.500" />
                      <VStack spacing={0} align="start" flex={1}>
                        <Text fontWeight="600">
                          {shop ? 'Modifier boutique' : 'Créer boutique'}
                        </Text>
                        <Text color={textMuted} fontSize="sm">
                          {shop ? 'Modifiez vos informations' : 'Commencez à vendre'}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Ajouter produit */}
                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  shadow="sm"
                  onClick={() => nav('/seller/product')}
                  cursor="pointer"
                  transition="all 0.2s"
                  _active={{ transform: 'scale(0.98)' }}
                >
                  <CardBody p={4}>
                    <HStack spacing={3}>
                      <Icon as={FiPlus} boxSize={5} color="green.500" />
                      <VStack spacing={0} align="start" flex={1}>
                        <Text fontWeight="600">Ajouter produit</Text>
                        <Text color={textMuted} fontSize="sm">
                          Nouveau produit au catalogue
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Voir boutique */}
                {shop && (
                  <Card
                    bg={cardBg}
                    borderRadius="xl"
                    shadow="sm"
                    onClick={() => nav('/seller/shop')}
                    cursor="pointer"
                    transition="all 0.2s"
                    _active={{ transform: 'scale(0.98)' }}
                  >
                    <CardBody p={4}>
                      <HStack spacing={3}>
                        <Icon as={FiEye} boxSize={5} color="purple.500" />
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontWeight="600">Voir boutique</Text>
                          <Text color={textMuted} fontSize="sm">
                            Comme vos clients la voient
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                )}

                {/* Supprimer boutique */}
                {shop && (
                  <Card
                    bg={cardBg}
                    borderRadius="xl"
                    shadow="sm"
                    onClick={handleDeleteShop}
                    cursor="pointer"
                    transition="all 0.2s"
                    _active={{ transform: 'scale(0.98)' }}
                    borderColor="red.200"
                  >
                    <CardBody p={4}>
                      <HStack spacing={3}>
                        <Icon as={FiTrash2} boxSize={5} color="red.500" />
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontWeight="600" color="red.600">
                            Supprimer boutique
                          </Text>
                          <Text color="red.400" fontSize="sm">
                            Action irréversible
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  )
}