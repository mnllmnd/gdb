import React, { useEffect, useState } from 'react'
import { Container, Heading, Box, Text, Button, SimpleGrid, useToast, VStack, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, useBreakpointValue, HStack, Input, Textarea } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
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

  // Tailles responsives
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' })
  const buttonHeight = useBreakpointValue({ base: '80px', md: '120px' })
  const gridSpacing = useBreakpointValue({ base: 4, md: 6 })

  async function loadAll() {
    try {
      const p = await api.products.list()
      const u = getItem('user') ? JSON.parse(getItem('user') as string) : null
      const mine = u ? p.filter((x: any) => String(x.seller_id) === String(u.id)) : []
      setProducts(mine)
    } catch (e) { console.error(e) }
    try { const o = await api.shops.orders(token); setOrders(o) } catch (e) { console.error(e) }
    try { const c = await api.shops.clients(token); setClients(c) } catch (e) { console.error(e) }
    try { const d = await api.shops.debts.list(token); setDebts(d) } catch (e) { console.error(e) }
  }

  async function addDebt() {
    if (!newDebtAmount) return alert('Entrez un montant')
    const entry = { client_id: null, amount: Number(newDebtAmount), note: newDebtNote }
    try {
      const updated = await api.shops.debts.add(entry, token)
      setDebts(updated)
      setNewDebtAmount('')
      setNewDebtNote('')
      toast({
        title: 'Dette ajoutée',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (e) { 
      console.error(e)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la dette',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  async function deleteShopConfirm() {
    if (!confirm('Voulez-vous vraiment supprimer votre boutique ? Cette action est irreversible.')) return
    try {
      const me = await api.shops.me(token)
      await api.shops.delete(me.id, token)
      toast({ title: 'Boutique supprimée', status: 'success' })
      globalThis.location.href = '/seller/setup'
    } catch (e) {
      console.error(e)
      toast({ title: 'Erreur', description: 'Impossible de supprimer la boutique', status: 'error' })
    }
  }

  async function copyShopLink() {
    try {
      const me = await api.shops.me(token)
      const url = `${globalThis.location.origin}/shop/${me.domain}`
      await navigator.clipboard.writeText(url)
      toast({ 
        title: 'Lien copié !', 
        description: 'Le lien de votre boutique a été copié dans le presse-papier', 
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (e) {
      console.error(e)
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de copier le lien', 
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  if (!token || !user) {
    return (
      <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
        <BackButton />
        <Heading mb={4} textAlign="center" color="gray.700">Votre boutique</Heading>
        <Box textAlign="center" py={8}>
          <Text mb={4} color="gray.600">Connectez-vous pour pouvoir gérer votre boutique.</Text>
          <Button colorScheme="blue" onClick={() => { globalThis.location.href = '/login' }}>Se connecter</Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton />
      
      {/* En-tête avec titre élégant */}
      <VStack spacing={4} mb={8}>
        <Heading 
          size="xl" 
          fontWeight="700"
          bgGradient="linear(to-r, blue.500, purple.500)"
          bgClip="text"
          textAlign="center"
        >
          Tableau de bord
        </Heading>
        <Text color="gray.600" textAlign="center" maxW="md">
          Gérez votre boutique en toute simplicité
        </Text>
      </VStack>

      {/* Actions principales */}
      <SimpleGrid 
        columns={{ base: 1, md: 2, lg: 3 }} 
        spacing={gridSpacing} 
        mb={8}
      >
        <Card 
          bg="white"
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0,0,0,0.05)"
          border="1px solid"
          borderColor="gray.100"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
          }}
          transition="all 0.3s ease"
          cursor="pointer"
          onClick={() => navigate('/seller/product')}
        >
          <CardBody p={6}>
            <VStack spacing={4} textAlign="center">
              <Box p={3} bg="blue.50" borderRadius="full">
                <Text fontSize="2xl">📦</Text>
              </Box>
              <Text fontWeight="600" color="gray.700">Gérer les produits</Text>
              <Text fontSize="sm" color="gray.500">
                {products.length} produit(s) en vente
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card 
          bg="white"
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0,0,0,0.05)"
          border="1px solid"
          borderColor="gray.100"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
          }}
          transition="all 0.3s ease"
          cursor="pointer"
          onClick={() => navigate('/seller/orders')}
        >
          <CardBody p={6}>
            <VStack spacing={4} textAlign="center">
              <Box p={3} bg="green.50" borderRadius="full">
                <Text fontSize="2xl">🛒</Text>
              </Box>
              <Text fontWeight="600" color="gray.700">Commandes & Clients</Text>
              <Text fontSize="sm" color="gray.500">
                {orders.length} commande(s) • {clients.length} client(s)
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card 
          bg="white"
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0,0,0,0.05)"
          border="1px solid"
          borderColor="gray.100"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
          }}
          transition="all 0.3s ease"
          cursor="pointer"
          onClick={copyShopLink}
        >
          <CardBody p={6}>
            <VStack spacing={4} textAlign="center">
              <Box p={3} bg="purple.50" borderRadius="full">
                <Text fontSize="2xl">🔗</Text>
              </Box>
              <Text fontWeight="600" color="gray.700">Lien boutique</Text>
              <Text fontSize="sm" color="gray.500">
                Copier le lien public
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Statistiques */}
      <Card 
        bg="white"
        borderRadius="xl"
        boxShadow="0 4px 16px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor="gray.100"
        mb={8}
      >
        <CardBody p={6}>
          <Heading size="md" mb={6} color="gray.700" display="flex" alignItems="center" gap={2}>
            <Box p={2} bg="blue.50" borderRadius="md">📊</Box>
            Aperçu de votre activité
          </Heading>
          
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat p={4} bg="blue.50" borderRadius="lg" textAlign="center">
              <StatLabel color="blue.600" fontSize="sm" fontWeight="500">Produits</StatLabel>
              <StatNumber color="blue.700" fontSize="2xl" fontWeight="700">{products.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs" color="blue.600">en vente</StatHelpText>
            </Stat>

            <Stat p={4} bg="green.50" borderRadius="lg" textAlign="center">
              <StatLabel color="green.600" fontSize="sm" fontWeight="500">Commandes</StatLabel>
              <StatNumber color="green.700" fontSize="2xl" fontWeight="700">{orders.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs" color="green.600">au total</StatHelpText>
            </Stat>

            <Stat p={4} bg="purple.50" borderRadius="lg" textAlign="center">
              <StatLabel color="purple.600" fontSize="sm" fontWeight="500">Clients</StatLabel>
              <StatNumber color="purple.700" fontSize="2xl" fontWeight="700">{clients.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs" color="purple.600">uniques</StatHelpText>
            </Stat>

            <Stat p={4} bg="orange.50" borderRadius="lg" textAlign="center">
              <StatLabel color="orange.600" fontSize="sm" fontWeight="500">Dettes</StatLabel>
              <StatNumber color="orange.700" fontSize="2xl" fontWeight="700">{debts.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs" color="orange.600">en cours</StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Section dettes */}
      <Card 
        bg="white"
        borderRadius="xl"
        boxShadow="0 4px 16px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor="gray.100"
        mb={8}
      >
        <CardBody p={6}>
          <Heading size="md" mb={4} color="gray.700">Ajouter une dette</Heading>
          <VStack spacing={4} align="stretch">
            <HStack spacing={3}>
              <Input
                placeholder="Montant"
                value={newDebtAmount}
                onChange={(e) => setNewDebtAmount(e.target.value)}
                type="number"
                bg="white"
                borderColor="gray.200"
              />
              <Button colorScheme="blue" onClick={addDebt} flexShrink={0}>
                Ajouter
              </Button>
            </HStack>
            <Textarea
              placeholder="Note (optionnelle)"
              value={newDebtNote}
              onChange={(e) => setNewDebtNote(e.target.value)}
              bg="white"
              borderColor="gray.200"
              size="sm"
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Bouton suppression */}
      <Box textAlign="center" mt={8}>
        <Button 
          variant="outline" 
          colorScheme="red" 
          size="md"
          onClick={deleteShopConfirm}
          borderColor="red.200"
          _hover={{
            bg: 'red.50',
            borderColor: 'red.300'
          }}
        >
          🗑️ Supprimer la boutique
        </Button>
      </Box>
    </Container>
  )
}