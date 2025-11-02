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
  VStack,
  HStack,
  Badge,
  Icon,
  Card,
  CardBody,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { highRes, PRODUCT_PLACEHOLDER, SHOP_PLACEHOLDER } from '../utils/image'
import { getItem } from '../utils/localAuth'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { FiPackage, FiShoppingBag, FiSettings, FiTrash2, FiEdit2, FiPlus, FiEye } from 'react-icons/fi'

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

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }}>
        <BackButton />

        {/* Hero Header */}
        <Card
          mb={8}
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="xl"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
        >
          <Box
            h="6px"
            bgGradient="linear(to-r, blue.400, purple.500)"
          />
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={4}>
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" borderRadius="lg">
                  <Icon as={FiShoppingBag} boxSize={8} color="blue.500" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size={{ base: 'lg', md: 'xl' }} color={headingColor} fontWeight="800">
                    Tableau de bord vendeur
                  </Heading>
                  <Text color={textMuted} fontSize={{ base: 'sm', md: 'md' }}>
                    Gérez votre activité commerciale
                  </Text>
                </VStack>
              </HStack>

              {/* Quick Stats */}
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} w="100%" pt={4}>
                <Box
                  p={4}
                  bg="blue.50"
                  borderRadius="xl"
                  textAlign="center"
                  border="1px solid"
                  borderColor="blue.100"
                >
                  <Text fontSize="2xl" fontWeight="800" color="blue.700">
                    {products.length}
                  </Text>
                  <Text fontSize="xs" color="blue.600" fontWeight="600">
                    Produits
                  </Text>
                </Box>
                <Box
                  p={4}
                  bg="green.50"
                  borderRadius="xl"
                  textAlign="center"
                  border="1px solid"
                  borderColor="green.100"
                >
                  <Text fontSize="2xl" fontWeight="800" color="green.700">
                    {shop ? '1' : '0'}
                  </Text>
                  <Text fontSize="xs" color="green.600" fontWeight="600">
                    Boutique
                  </Text>
                </Box>
                <Box
                  p={4}
                  bg="purple.50"
                  borderRadius="xl"
                  textAlign="center"
                  border="1px solid"
                  borderColor="purple.100"
                  gridColumn={{ base: 'span 2', md: 'auto' }}
                >
                  <Text fontSize="2xl" fontWeight="800" color="purple.700">
                    Actif
                  </Text>
                  <Text fontSize="xs" color="purple.600" fontWeight="600">
                    Statut
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={8}>
          <Button
            leftIcon={<Icon as={shop ? FiSettings : FiPlus} />}
            colorScheme="blue"
            onClick={() => nav('/seller/setup')}
            size="lg"
            borderRadius="xl"
            fontWeight="600"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            {shop ? 'Modifier' : 'Créer'}
          </Button>

          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="green"
            onClick={() => nav('/seller/product')}
            size="lg"
            borderRadius="xl"
            fontWeight="600"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            Produit
          </Button>

          {shop && (
            <Button
              leftIcon={<Icon as={FiEye} />}
              variant="outline"
              colorScheme="purple"
              onClick={() => nav('/seller/shop')}
              size="lg"
              borderRadius="xl"
              fontWeight="600"
              _hover={{ transform: 'translateY(-2px)', bg: 'purple.50' }}
              transition="all 0.2s"
            >
              Boutique
            </Button>
          )}

          {shop && (
            <Button
              leftIcon={<Icon as={FiTrash2} />}
              colorScheme="red"
              variant="outline"
              onClick={handleDeleteShop}
              size="lg"
              borderRadius="xl"
              fontWeight="600"
              _hover={{ transform: 'translateY(-2px)', bg: 'red.50' }}
              transition="all 0.2s"
            >
              Supprimer
            </Button>
          )}
        </SimpleGrid>

        {/* Main Content */}
        {loading ? (
          <Card bg={cardBg} borderRadius="2xl" boxShadow="lg">
            <CardBody p={12}>
              <VStack spacing={4}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text color={textMuted}>Chargement en cours...</Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={6} align="stretch">
            {/* Shop Info Card */}
            {shop && (
              <Card
                bg={cardBg}
                borderRadius="2xl"
                boxShadow="lg"
                border="1px solid"
                borderColor="gray.200"
                overflow="hidden"
              >
                <Box h="4px" bg="purple.400" />
                <CardBody p={6}>
                  <HStack spacing={3} mb={3}>
                    <Box p={1.5} bg="purple.50" borderRadius="md">
                      <Icon as={FiShoppingBag} boxSize={5} color="purple.500" />
                    </Box>
                    <Heading size="md" color={headingColor}>
                      Ma boutique
                    </Heading>
                  </HStack>

                  <Flex 
                    align="center" 
                    gap={4}
                    direction={{ base: 'column', sm: 'row' }}
                  >
                    <Image
                      src={highRes(shop.logo_url) ?? SHOP_PLACEHOLDER}
                      boxSize={{ base: '80px', md: '100px' }}
                      objectFit="cover"
                      borderRadius="xl"
                      border="2px solid"
                      borderColor="gray.200"
                      onError={(e: any) => {
                        e.currentTarget.src = SHOP_PLACEHOLDER
                      }}
                    />
                    <VStack align={{ base: 'center', sm: 'start' }} spacing={1} flex={1}>
                      <Heading size="sm" color={headingColor}>
                        {shop.name ?? 'Ma boutique'}
                      </Heading>
                      <Text color={textMuted} fontSize="sm" textAlign={{ base: 'center', sm: 'left' }}>
                        {shop.description || 'Aucune description'}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="purple" fontSize="xs" borderRadius="full">
                          🌐 {shop.domain ?? '—'}
                        </Badge>
                      </HStack>
                    </VStack>
                  </Flex>
                </CardBody>
              </Card>
            )}

            {/* Products Section */}
            <Card
              bg={cardBg}
              borderRadius="2xl"
              boxShadow="lg"
              border="1px solid"
              borderColor="gray.200"
            >
              <Box h="4px" bg="blue.400" />
              <CardBody p={6}>
                <HStack justify="space-between" mb={4}>
                  <HStack spacing={3}>
                    <Box p={1.5} bg="blue.50" borderRadius="md">
                      <Icon as={FiPackage} boxSize={5} color="blue.500" />
                    </Box>
                    <Heading size="md" color={headingColor}>
                      Mes produits
                    </Heading>
                  </HStack>
                  <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                    {products.length}
                  </Badge>
                </HStack>

                {products.length === 0 ? (
                  <Box
                    p={12}
                    textAlign="center"
                    bg="gray.50"
                    borderRadius="xl"
                    border="2px dashed"
                    borderColor="gray.300"
                  >
                    <Icon as={FiPackage} boxSize={12} color="gray.400" mb={4} />
                    <Text color={textMuted} fontWeight="500">
                      Aucun produit ajouté pour le moment
                    </Text>
                    <Button
                      mt={4}
                      colorScheme="blue"
                      leftIcon={<Icon as={FiPlus} />}
                      onClick={() => nav('/seller/product')}
                      borderRadius="xl"
                    >
                      Ajouter mon premier produit
                    </Button>
                  </Box>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {products.map((p) => (
                      <Card
                        key={p.id}
                        bg="gray.50"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="gray.200"
                        transition="all 0.2s ease"
                        _hover={{ 
                          boxShadow: 'md', 
                          transform: 'translateY(-2px)',
                          borderColor: 'blue.300'
                        }}
                      >
                        <CardBody p={4}>
                          <Flex 
                            align="center" 
                            gap={4}
                            direction={{ base: 'column', sm: 'row' }}
                          >
                            <Box
                              boxSize={{ base: '100px', md: '120px' }}
                              flexShrink={0}
                              bg="white"
                              borderRadius="lg"
                              overflow="hidden"
                              border="1px solid"
                              borderColor="gray.200"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Image
                                src={highRes(p.image_url, { width: 400, quality: 80 }) ?? PRODUCT_PLACEHOLDER}
                                alt={p.title}
                                objectFit="cover"
                                maxW="100%"
                                maxH="100%"
                              />
                            </Box>

                            <VStack align={{ base: 'center', sm: 'start' }} spacing={2} flex={1}>
                              <Heading 
                                size="sm" 
                                color={headingColor} 
                                noOfLines={1}
                                textAlign={{ base: 'center', sm: 'left' }}
                              >
                                {p.title}
                              </Heading>
                              <Text 
                                noOfLines={2} 
                                color={textMuted} 
                                fontSize="sm"
                                textAlign={{ base: 'center', sm: 'left' }}
                              >
                                {p.description || 'Aucune description'}
                              </Text>

                              <HStack spacing={2}>
                                <Badge
                                  colorScheme="green"
                                  fontSize="md"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontWeight="700"
                                >
                                  {Math.floor(p.price)} FCFA
                                </Badge>
                                {p.quantity > 0 ? (
                                  <Badge colorScheme="blue" borderRadius="full">
                                    Stock: {p.quantity}
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="red" borderRadius="full">
                                    Rupture
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>

                            <HStack spacing={2} flexShrink={0}>
                              <IconButton
                                aria-label="Modifier"
                                icon={<Icon as={FiEdit2} />}
                                onClick={() => nav(`/seller/product/${p.id}`)}
                                variant="outline"
                                colorScheme="blue"
                                borderRadius="lg"
                                size={{ base: 'sm', md: 'md' }}
                              />
                              <IconButton
                                aria-label="Supprimer"
                                icon={<Icon as={FiTrash2} />}
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDelete(String(p.id))}
                                borderRadius="lg"
                                size={{ base: 'sm', md: 'md' }}
                              />
                            </HStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </VStack>
        )}
      </Container>
    </Box>
  )
}