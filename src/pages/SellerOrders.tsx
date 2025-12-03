import React, { useEffect, useState } from 'react'
import { Container, Heading, Box, Text, useToast, Stack, Spinner, Button, Image, HStack, VStack, Badge, useColorModeValue } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import mapOrderStatus from '../utils/status'

export default function SellerOrders() {
  const token = getItem('token') ?? undefined
  const [orders, setOrders] = useState<any[]>([])
  const [shipped, setShipped] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const sectionBg = useColorModeValue('white', 'gray.900')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const o = await api.orders.sellerOrders(token)
      setOrders(o || [])
      // initialize shipped state from server if present
      const initial: Record<string, boolean> = {}
      for (const it of (o || [])) { initial[String(it.id)] = !!it.shipped }
      setShipped(initial)
    } catch (e) {
      console.error(e)
      toast({ title: 'Erreur', description: 'Impossible de récupérer les commandes', status: 'error' })
    } finally { setLoading(false) }
  }

  async function handleDelete(orderId: string) {
    if (!globalThis.confirm('Supprimer cette commande ? Cette action est irréversible.')) {
      return
    }
    try {
      await api.orders.delete(orderId, token)
      setOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
      toast({ title: 'Commande supprimée', status: 'success' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erreur', description: 'Impossible de supprimer la commande', status: 'error' })
    }
  }

  return (
    <Container maxW="container.md" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
  {/* BackButton removed: browser handles navigation/back */}
      <Heading mb={4}>Commandes reçues</Heading>
      {loading && <Spinner />}
      {!loading && orders.length === 0 && <Text>Aucune commande pour le moment.</Text>}
      {!loading && orders.length > 0 && (
        <Stack spacing={{ base: 3, md: 4 }}>
          {orders.map((o) => (
            <Box key={o.id} bg={sectionBg} borderRadius="lg" p={{ base: 3, md: 4 }} boxShadow="sm" borderWidth="1px">
              <HStack align="start" spacing={{ base: 3, md: 4 }}>
                {o.product_image && (
                  <Image src={o.product_image} alt={o.product_title || 'Produit'} boxSize={{ base: '56px', md: '88px' }} objectFit="cover" borderRadius="md" />
                )}
                <VStack align="start" spacing={1} flex="1">
                  <HStack justify="space-between" width="100%">
                    <Text fontWeight="700">{o.product_title}</Text>
                    {(() => {
                      const mapped = mapOrderStatus(o.status ?? o.state)
                      return <Badge colorScheme={mapped.color as any}>{mapped.label}</Badge>
                    })()}
                  </HStack>
                  <Box 
                    bg="green.50" 
                    display="inline-block" 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                  >
                    <Text 
                      fontSize="md" 
                      color="green.700" 
                      fontWeight="bold"
                    >
                      Montant: {Math.floor((Number(o.price || 0) + Number(o.delivery_price || 0)))} FCFA
                    </Text>
                  </Box>
                  <Text color="gray.600">Client: {o.buyer_name ?? `#${o.buyer_id ?? '—'}`}</Text>
                  {o.buyer_phone && <Text color="gray.600">Téléphone: {o.buyer_phone}</Text>}
                  {o.address && <Text color="gray.600">Adresse: {o.address}</Text>}
                </VStack>
              </HStack>
              <HStack mt={4} spacing={3}>
                <Button size="sm" colorScheme={shipped[String(o.id)] ? 'green' : 'brand'} onClick={() => {
                  const key = String(o.id)
                  setShipped(s => ({ ...s, [key]: !s[key] }))
                  toast({ title: shipped[String(o.id)] ? 'Expédition annulée' : 'Marqué expédiée', status: 'success' })
                }}>{shipped[String(o.id)] ? 'Annuler expédition' : 'Marquer expédiée'}</Button>
                <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDelete(o.id)}>Supprimer</Button>
              </HStack>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  )
}
