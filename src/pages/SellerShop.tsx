import React, { useEffect, useState } from 'react'
import { 
  Container, 
  Heading, 
  Box, 
  Text, 
  Button, 
  SimpleGrid, 
  useToast, 
  VStack, 
  Card, 
  CardBody, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  useBreakpointValue, 
  HStack, 
  Input, 
  Textarea,
  Icon,
  Divider,
  Badge,
  Flex
} from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiPackage, FiShoppingCart, FiLink, FiBarChart2, FiUsers, FiDollarSign, FiTrash2 } from 'react-icons/fi'
import api from '../services/api'
import { getItem } from '../utils/localAuth'

export default function SellerShop() {
  const token = getItem('token') ?? undefined
  const user = getItem('user') ? JSON.parse(getItem('user') as string) : null
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [newDebtNote, setNewDebtNote] = useState('')
  const [newDebtAmount, setNewDebtAmount] = useState('')

  useEffect(() => { loadAll() }, [])
  const navigate = useNavigate()
  const toast = useToast()

  // Tailles responsives optimisées
  const gridColumns = useBreakpointValue({ base: 2, sm: 2, md: 3 })
  const statsColumns = useBreakpointValue({ base: 2, md: 4 })
  const sectionBg = useColorModeValue('white', 'gray.800')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700')

  async function loadAll() {
    try {
      const p = await api.products.list()
      const u = getItem('user') ? JSON.parse(getItem('user') as string) : null
      const mine = u ? p.filter((x: any) => String(x.seller_id) === String(u.id)) : []
      setProducts(mine)
    } catch (e) { console.error(e) }
  }

 
  if (!token || !user) {
    return (
      <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }}>
        <Card
          maxW="md"
          mx="auto"
          mt={8}
          bg="white"
          borderRadius="2xl"
          boxShadow="xl"
          border="1px solid"
          borderColor="gray.100"
        >
          <CardBody p={10}>
            <VStack spacing={6} textAlign="center">
              <Box
                p={5}
                bg="blue.50"
                borderRadius="full"
              >
                <Icon as={FiPackage} boxSize={12} color="blue.500" />
              </Box>
              <VStack spacing={2}>
                <Heading size="lg" color="gray.800">Votre boutique</Heading>
                <Text color="gray.600">
                  Connectez-vous pour gérer votre boutique
                </Text>
              </VStack>
              <Button 
                colorScheme="brand" 
                size="lg"
                w="100%"
                borderRadius="xl"
                onClick={() => { globalThis.location.href = '/login' }}
              >
                Se connecter
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    )
  }

  return (
  <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }}>
      
      {/* Hero Header */}
      <Box
        mb={8}
        p={{ base: 6, md: 8 }}
        bg={sectionBg}
        borderRadius="2xl"
        boxShadow="xl"
        border="1px solid"
        borderColor={cardBorderColor}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          width="200px"
          height="200px"
          bg="brand.50"
          borderRadius="full"
          opacity="0.5"
          filter="blur(40px)"
        />
        
        <VStack spacing={3} position="relative" zIndex={1}>
          <HStack spacing={2}>
            <Icon as={FiBarChart2} boxSize={8} color="brand.500" />
            <Heading 
              size={{ base: 'lg', md: 'xl' }}
              fontWeight="800"
              color="gray.800"
            >
              Tableau de bord
            </Heading>
          </HStack>
          <Text color="gray.600" textAlign="center" fontSize={{ base: 'sm', md: 'md' }}>
            Gérez votre boutique en toute simplicité
          </Text>
        </VStack>
      </Box>

      {/* Actions principales - Compactes sur mobile */}
      <SimpleGrid 
        columns={gridColumns}
        spacing={3}
        mb={6}
      >
        <Card 
          bg={sectionBg}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor={cardBorderColor}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
            borderColor: 'blue.300'
          }}
          transition="all 0.3s ease"
          cursor="pointer"
          onClick={() => navigate('/seller/product')}
          height={{ base: '120px', md: '140px' }}
        >
          <CardBody p={{ base: 4, md: 6 }} display="flex" flexDirection="column" justifyContent="center">
            <VStack spacing={2} textAlign="center">
              <Box p={2} bg="blue.50" borderRadius="lg">
                <Icon as={FiPackage} boxSize={{ base: 5, md: 6 }} color="blue.500" />
              </Box>
              <Text fontWeight="700" color="gray.800" fontSize={{ base: 'sm', md: 'md' }}>
                Produits
              </Text>
              <Badge colorScheme="blue" fontSize={{ base: 'xs', md: 'sm' }} borderRadius="full">
                {products.length}
              </Badge>
            </VStack>
          </CardBody>
        </Card>

        <Card 
          bg={sectionBg}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor={cardBorderColor}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
            borderColor: 'green.300'
          }}
          transition="all 0.3s ease"
          cursor="pointer"
          onClick={() => navigate('/seller/orders')}
          height={{ base: '120px', md: '140px' }}
        >
          <CardBody p={{ base: 4, md: 6 }} display="flex" flexDirection="column" justifyContent="center">
            <VStack spacing={2} textAlign="center">
              <Box p={2} bg="green.50" borderRadius="lg">
                <Icon as={FiShoppingCart} boxSize={{ base: 5, md: 6 }} color="green.500" />
              </Box>
              <Text fontWeight="700" color="gray.800" fontSize={{ base: 'sm', md: 'md' }}>
                Commandes
              </Text>
              <Badge colorScheme="green" fontSize={{ base: 'xs', md: 'sm' }} borderRadius="full">
                {orders.length}
              </Badge>
            </VStack>
          </CardBody>
        </Card>

        <Card 
          bg={sectionBg}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor={cardBorderColor}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
            borderColor: 'purple.300'
          }}
          transition="all 0.3s ease"
          cursor="pointer"
          height={{ base: '120px', md: '140px' }}
        >
          <CardBody p={{ base: 4, md: 6 }} display="flex" flexDirection="column" justifyContent="center">
            <VStack spacing={2} textAlign="center">
              <Box p={2} bg="purple.50" borderRadius="lg">
                <Icon as={FiLink} boxSize={{ base: 5, md: 6 }} color="purple.500" />
              </Box>
              <Text fontWeight="700" color="gray.800" fontSize={{ base: 'sm', md: 'md' }}>
                Lien
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
                Copier
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Statistiques compactes */}
      <Card 
        bg={sectionBg}
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor={cardBorderColor}
        mb={6}
      >
        <CardBody p={{ base: 4, md: 6 }}>
          <HStack spacing={2} mb={4}>
            <Box p={1.5} bg="blue.50" borderRadius="md">
              <Icon as={FiBarChart2} boxSize={5} color="blue.500" />
            </Box>
            <Heading size="sm" color="gray.700">
              Statistiques
            </Heading>
          </HStack>
          
          <SimpleGrid columns={statsColumns} spacing={3}>
            <Stat 
              p={3} 
              bg="blue.50" 
              borderRadius="lg" 
              textAlign="center"
              border="1px solid"
              borderColor="blue.100"
            >
              <StatNumber color="blue.700" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">
                {products.length}
              </StatNumber>
              <StatLabel color="blue.600" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                Produits
              </StatLabel>
            </Stat>

            <Stat 
              p={3} 
              bg="green.50" 
              borderRadius="lg" 
              textAlign="center"
              border="1px solid"
              borderColor="green.100"
            >
              <StatNumber color="green.700" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">
                {orders.length}
              </StatNumber>
              <StatLabel color="green.600" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                Commandes
              </StatLabel>
            </Stat>

            <Stat 
              p={3} 
              bg="purple.50" 
              borderRadius="lg" 
              textAlign="center"
              border="1px solid"
              borderColor="purple.100"
            >
              <StatNumber color="purple.700" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">
                {clients.length}
              </StatNumber>
              <StatLabel color="purple.600" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                Clients
              </StatLabel>
            </Stat>

            <Stat 
              p={3} 
              bg="orange.50" 
              borderRadius="lg" 
              textAlign="center"
              border="1px solid"
              borderColor="orange.100"
            >
              <StatNumber color="orange.700" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">
                {debts.length}
              </StatNumber>
              <StatLabel color="orange.600" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                Dettes
              </StatLabel>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Section dettes compacte */}
      <Card 
        bg={sectionBg}
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor={cardBorderColor}
        mb={6}
      >
        <CardBody p={{ base: 4, md: 6 }}>
          <HStack spacing={2} mb={4}>
            <Box p={1.5} bg="orange.50" borderRadius="md">
              <Icon as={FiDollarSign} boxSize={5} color="orange.500" />
            </Box>
            <Heading size="sm" color="gray.700">
              Ajouter une dette
            </Heading>
          </HStack>
          
          <VStack spacing={3} align="stretch">
            <HStack spacing={2}>
              <Input
                placeholder="Montant"
                value={newDebtAmount}
                onChange={(e) => setNewDebtAmount(e.target.value)}
                type="number"
                bg="gray.50"
                borderColor="gray.200"
                borderRadius="lg"
                size={{ base: 'md', md: 'lg' }}
                _focus={{
                  borderColor: 'orange.400',
                  bg: 'white'
                }}
              />
              <Button 
                colorScheme="orange" 
                flexShrink={0}
                borderRadius="lg"
                size={{ base: 'md', md: 'lg' }}
                px={{ base: 4, md: 6 }}
              >
                Ajouter
              </Button>
            </HStack>
            <Textarea
              placeholder="Note (optionnelle)"
              value={newDebtNote}
              onChange={(e) => setNewDebtNote(e.target.value)}
              bg="gray.50"
              borderColor="gray.200"
              borderRadius="lg"
              size="sm"
              rows={2}
              _focus={{
                borderColor: 'orange.400',
                bg: 'white'
              }}
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Bouton suppression */}
      <Card
        bg="red.50"
        borderRadius="xl"
        border="1px solid"
        borderColor="red.200"
      >
        <CardBody p={{ base: 4, md: 6 }}>
          <Flex 
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
            gap={4}
          >
            <HStack spacing={3}>
              <Box p={2} bg="red.100" borderRadius="lg">
                <Icon as={FiTrash2} boxSize={5} color="red.600" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="700" color="red.700" fontSize={{ base: 'sm', md: 'md' }}>
                  Zone dangereuse
                </Text>
                <Text fontSize="xs" color="red.600">
                  Action irréversible
                </Text>
              </VStack>
            </HStack>
            <Button 
              variant="outline" 
              colorScheme="red" 
              size={{ base: 'sm', md: 'md' }}
              borderRadius="lg"
              fontWeight="600"
              leftIcon={<Icon as={FiTrash2} />}
              w={{ base: '100%', md: 'auto' }}
            >
              Supprimer la boutique
            </Button>
          </Flex>
        </CardBody>
      </Card>
    </Container>
  )
}