import React from 'react'
import { Box, Text, VStack, HStack, Spinner, Button, Badge } from '@chakra-ui/react'
import api from '../services/api'

export default function ReviewsList({ productId, shopId }: { productId?: string; shopId?: string }) {
  const [loading, setLoading] = React.useState(true)
  const [reviews, setReviews] = React.useState<any[]>([])
  const [aggregate, setAggregate] = React.useState<{ average: number | null; count: number }>({ average: null, count: 0 })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.reviews.list({ product_id: productId, shop_id: shopId, limit: 50 })
      setReviews(res.reviews || [])
      setAggregate(res.aggregate || { average: null, count: 0 })
    } catch (err) {
      console.error('Failed to load reviews', err)
      setReviews([])
      setAggregate({ average: null, count: 0 })
    } finally {
      setLoading(false)
    }
  }, [productId, shopId])

  React.useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    try {
      const token = (globalThis as any)?.localStorage?.getItem?.('token')
      await api.reviews.delete(id, token ?? undefined)
      load()
    } catch (err) {
      console.error('Failed to delete review', err)
    }
  }

  if (loading) return <Spinner />

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={3}>
        <Text fontWeight={700}>Avis ({aggregate.count})</Text>
        {aggregate.average !== null && (
          <Badge colorScheme="yellow">{aggregate.average.toFixed(1)} ⭐</Badge>
        )}
      </HStack>

      {reviews.length === 0 ? (
        <Text color="gray.600">Aucun avis pour le moment.</Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {reviews.map((r) => (
            <Box key={r.id} p={3} borderRadius="md" bg="white" boxShadow="sm">
              <HStack justify="space-between" mb={2}>
                <Text fontWeight={600}>{r.user_name || 'Utilisateur anonyme'}</Text>
                <HStack>
                  <Badge colorScheme="green">{r.rating} ⭐</Badge>
                  <Text fontSize="sm" color="gray.500">{new Date(r.created_at).toLocaleString()}</Text>
                </HStack>
              </HStack>
              <Text>{r.comment}</Text>
              {String(r.user_id) === String((globalThis as any)?.localStorage?.getItem?.('userId')) && (
                <Button size="sm" mt={2} variant="ghost" colorScheme="red" onClick={() => handleDelete(r.id)}>Supprimer</Button>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  )
}