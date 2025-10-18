import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Spinner } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getItem('token')
    api.orders.my(token ?? undefined).then((r) => setOrders(r)).catch((e) => console.error(e)).finally(() => setLoading(false))
  }, [])

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={4}>Mes commandes</Heading>
      {loading ? <Spinner /> : (
        orders.length === 0 ? <Text>Aucune commande.</Text> : (
          <Stack spacing={4}>
            {orders.map((o) => (
              <Box key={o.id} borderWidth="1px" borderRadius="md" p={4}>
                <Text fontWeight="bold">Commande #{o.id} - {o.status}</Text>
                <Text>Montant: {o.total} CFA</Text>
                <Text>Produits: {o.items?.map((it:any) => it.title).join(', ')}</Text>
              </Box>
            ))}
          </Stack>
        )
      )}
    </Container>
  )
}
