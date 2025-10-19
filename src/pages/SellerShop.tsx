import React, { useEffect, useState } from 'react'
import { Container, Heading, Box, Text, Button, SimpleGrid, useToast, VStack, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, useBreakpointValue } from '@chakra-ui/react'
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
    } catch (e) { console.error(e) }
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
        <Heading mb={4} textAlign="center">Votre boutique</Heading>
        <Box textAlign="center" py={8}>
          <Text mb={4}>Connectez-vous pour pouvoir gérer votre boutique.</Text>
          <Button colorScheme="brand" onClick={() => { globalThis.location.href = '/login' }}>Se connecter</Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton />
      
      {/* Titre principal */}
      <Heading 
        mb={8} 
        textAlign="center" 
        size="xl" 
        fontWeight="700"
        bgGradient="linear(to-r, brand.500, accent.500)"
        bgClip="text"
      >
        Votre boutique
      </Heading>

      {/* Grille des actions principales */}
      <SimpleGrid 
        columns={{ base: 1, md: 3 }} 
        spacing={gridSpacing} 
        mb={8}
      >
        <Button 
          variant="solid" 
          colorScheme="brand" 
          size={buttonSize}
          height={buttonHeight}
          w="100%"
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0,0,0,0.1)"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}
          transition="all 200ms ease"
          onClick={() => navigate('/seller/product')}
        >
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="600">📦</Text>
            <Text fontSize="sm" fontWeight="600">Gérer les produits</Text>
          </VStack>
        </Button>

        <Button 
          variant="solid" 
          colorScheme="brand" 
          size={buttonSize}
          height={buttonHeight}
          w="100%"
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0,0,0,0.1)"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}
          transition="all 200ms ease"
          onClick={() => navigate('/seller/orders')}
        >
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="600">🛒</Text>
            <Text fontSize="sm" fontWeight="600">Commandes & Clients</Text>
          </VStack>
        </Button>

        <Button 
          variant="outline" 
          colorScheme="red" 
          size={buttonSize}
          height={buttonHeight}
          w="100%"
          borderRadius="xl"
          boxShadow="0 2px 8px rgba(0,0,0,0.08)"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
            bg: 'red.50'
          }}
          transition="all 200ms ease"
          onClick={deleteShopConfirm}
        >
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="600">🗑️</Text>
            <Text fontSize="sm" fontWeight="600">Supprimer la boutique</Text>
          </VStack>
        </Button>
      </SimpleGrid>

      {/* Bouton copier le lien */}
      <Box mb={8}>
        <Button 
          variant="subtle" 
          colorScheme="brand" 
          size="md"
          width="100%"
          borderRadius="lg"
          py={6}
          onClick={copyShopLink}
          boxShadow="0 2px 6px rgba(0,0,0,0.05)"
          _hover={{
            bg: 'brand.50',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          transition="all 200ms ease"
        >
          <VStack spacing={1}>
            <Text fontSize="lg">🔗</Text>
            <Text fontWeight="500">Copier le lien de ma boutique</Text>
          </VStack>
        </Button>
      </Box>

      {/* Carte des statistiques */}
      <Card 
        bgGradient="linear(to-r, brand.50, accent.50)" 
        borderRadius="xl" 
        boxShadow="0 4px 16px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor="brand.100"
        mt={6}
      >
        <CardBody p={6}>
          <Heading size="md" mb={6} textAlign="center" color="gray.700">
            📊 Aperçu de votre activité
          </Heading>
          
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat textAlign="center" p={3} bg="white" borderRadius="lg" boxShadow="sm">
              <StatLabel color="gray.600" fontSize="sm">Produits</StatLabel>
              <StatNumber color="brand.600" fontSize="2xl">{products.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs">en vente</StatHelpText>
            </Stat>

            <Stat textAlign="center" p={3} bg="white" borderRadius="lg" boxShadow="sm">
              <StatLabel color="gray.600" fontSize="sm">Commandes</StatLabel>
              <StatNumber color="accent.600" fontSize="2xl">{orders.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs">au total</StatHelpText>
            </Stat>

            <Stat textAlign="center" p={3} bg="white" borderRadius="lg" boxShadow="sm">
              <StatLabel color="gray.600" fontSize="sm">Clients</StatLabel>
              <StatNumber color="green.600" fontSize="2xl">{clients.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs">uniques</StatHelpText>
            </Stat>

            <Stat textAlign="center" p={3} bg="white" borderRadius="lg" boxShadow="sm">
              <StatLabel color="gray.600" fontSize="sm">Dettes</StatLabel>
              <StatNumber color="red.600" fontSize="2xl">{debts.length}</StatNumber>
              <StatHelpText m={0} fontSize="xs">en cours</StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Container>
  )
}