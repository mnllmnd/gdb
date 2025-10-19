import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Spinner } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getItem('token')
    if (!token) {
      setOrders([])
      setLoading(false)
      return
    }
    api.orders.my(token).then((r) => setOrders(r || [])).catch((e) => { console.error(e); setOrders([]) }).finally(() => setLoading(false))
  }, [])

  return (
    <Container maxW="container.md" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <Heading mb={4}>Mes commandes</Heading>
      {loading && <Spinner />}
      {!loading && orders.length === 0 && <Text>Aucune commande.</Text>}
      {!loading && orders.length > 0 && (
        <Stack spacing={4}>
          {orders.map((o) => (
            <Box key={o.id} borderWidth="1px" borderRadius="md" p={4}>
              <Text fontWeight="bold">Commande #{o.id} - {o.status}</Text>
              <Text>Montant: {o.total} CFA</Text>
              <Text>Produits: {o.items?.map((it:any) => it.title).join(', ')}</Text>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  )
}
