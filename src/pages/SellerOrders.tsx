import React, { useEffect, useState } from 'react'
import { Container, Heading, Box, Text, useToast, Stack, Spinner, Button, Image, HStack, VStack } from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import api from '../services/api'
import { getItem } from '../utils/localAuth'

export default function SellerOrders() {
  const token = getItem('token') ?? undefined
  const [orders, setOrders] = useState<any[]>([])
  const [shipped, setShipped] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const o = await api.shops.orders(token)
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
      await api.shops.deleteOrder(orderId, token)
      setOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
      toast({ title: 'Commande supprimée', status: 'success' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erreur', description: 'Impossible de supprimer la commande', status: 'error' })
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <BackButton />
      <Heading mb={4}>Commandes reçues</Heading>
      {loading && <Spinner />}
      {!loading && orders.length === 0 && <Text>Aucune commande pour le moment.</Text>}
      {!loading && orders.length > 0 && (
        <Stack spacing={3}>
          {orders.map((o) => (
            <Box key={o.id} p={3} borderWidth={1} borderRadius="md">
              <HStack align="start">
                {o.product_image && (
                  <Image src={o.product_image} alt={o.product_title || 'Produit'} boxSize="80px" objectFit="cover" borderRadius="md" />
                )}
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{o.product_title}</Text>
                  <Text>Montant: {o.price} FCFA</Text>
                  <Text>Client: {o.buyer_name ?? `#${o.buyer_id ?? '—'}`}</Text>
                  {o.buyer_phone && <Text>Téléphone: {o.buyer_phone}</Text>}
                  {o.address && <Text>Adresse: {o.address}</Text>}
                  <Text>État: {o.status ?? '—'}</Text>
                </VStack>
              </HStack>
              <Box mt={3}>
                <Button mr={3} size="sm" colorScheme={shipped[String(o.id)] ? 'green' : 'brand'} onClick={() => {
                  const key = String(o.id)
                  setShipped(s => ({ ...s, [key]: !s[key] }))
                  toast({ title: shipped[String(o.id)] ? 'Expédition annulée' : 'Marqué expédiée', status: 'success' })
                }}>{shipped[String(o.id)] ? 'Annuler expédition' : 'Marquer expédiée'}</Button>
                <Button size="sm" colorScheme="red" onClick={() => handleDelete(o.id)}>Supprimer</Button>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  )
}
