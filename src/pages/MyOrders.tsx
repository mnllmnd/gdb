import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Spinner, Button, useToast, HStack, Badge, VStack } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import mapOrderStatus from '../utils/status'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  // use mapOrderStatus to show a French label and a Chakra color

  useEffect(() => { loadOrders() }, [])

  useEffect(() => {
    function onAuth() { loadOrders() }
    if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('authChange', onAuth)
      return () => globalThis.removeEventListener('authChange', onAuth)
    }
    return () => {}
  }, [])

  async function loadOrders() {
    setLoading(true)
    const token = getItem('token')
    if (!token) {
      setOrders([])
      setLoading(false)
      return
    }
    try {
      const r = await api.orders.my(token)
      setOrders(r || [])
    } catch (err: any) {
      console.error('Failed to load orders', err)
      toast({ title: 'Erreur', description: 'Impossible de récupérer vos commandes', status: 'error' })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(orderId: string) {
    const token = getItem('token')
    if (!token) return toast({ title: 'Erreur', description: 'Vous devez être connecté', status: 'error' })
    try {
      await api.orders.cancel(orderId, token)
      toast({ title: 'Annulé', description: "La commande a été annulée.", status: 'success' })
      loadOrders()
    } catch (err: any) {
      console.error('Failed to cancel order', err)
      toast({ title: 'Erreur', description: err?.error || 'Impossible d\'annuler la commande', status: 'error' })
    }
  }

  async function handleDelete(orderId: string) {
    const token = getItem('token')
    if (!token) return toast({ title: 'Erreur', description: 'Vous devez être connecté', status: 'error' })
    try {
      await api.orders.delete(orderId, token)
      toast({ title: 'Supprimé', description: "La commande a été supprimée.", status: 'success' })
      loadOrders()
    } catch (err: any) {
      console.error('Failed to delete order', err)
      toast({ title: 'Erreur', description: err?.error || 'Impossible de supprimer la commande', status: 'error' })
    }
  }

  return (
    <Container maxW="container.md" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <Heading mb={4}>Mes commandes</Heading>
      <HStack mb={4} justify="space-between">
        <Heading size="md">Mes commandes</Heading>
        <Button size="sm" onClick={loadOrders}>Rafraîchir</Button>
      </HStack>

      {loading && <Spinner />}

      {!loading && !getItem('token') && (
        <Box>
          <Text mb={3}>Connectez-vous pour voir vos commandes.</Text>
          <Button as="a" href="/login">Se connecter</Button>
        </Box>
      )}

      {!loading && getItem('token') && orders.length === 0 && <Text>Aucune commande.</Text>}

      {/* orders: modern card rendering (kept single modern block below) */}
        {!loading && orders.length > 0 && (
          <Stack spacing={4}>
            {orders.map((o) => {
              const total = o.total ?? o.price ?? o.amount ?? '—'
              const status = o.status ?? o.state ?? '—'
              const image = o.product_image ?? (Array.isArray(o.items) && o.items[0]?.image) ?? null
              return (
                <Box key={o.id} bg="white" borderRadius="lg" p={{ base: 3, md: 4 }} boxShadow="sm" borderWidth="1px" overflow="hidden">
                  <HStack align="start" spacing={{ base: 3, md: 4 }}>
                        {image && (
                          <Box flexShrink={0} borderRadius="md" overflow="hidden" boxShadow="xs">
                            <img src={image} alt="product" style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }} />
                          </Box>
                        )}
                        <Box flex="1">
                          <HStack justify="space-between" align="start">
                            <Box>
                              <Text fontWeight="700" fontSize="md">Commande</Text>
                          <Text mt={2} fontSize="sm" color="gray.700" whiteSpace="normal" wordBreak="break-word">
                            {Array.isArray(o.items) ? (
                              o.items.map((it:any) => (it.title || it.product_title || it.name)).join(', ')
                            ) : (
                              (o.product_title || o.title || '—')
                            )}
                          </Text>
                          <Box 
                            bg="green.50" 
                            display="inline-block" 
                            px={2} 
                            py={1} 
                            borderRadius="md"
                            mt={2}
                          >
                            <Text 
                              fontSize="md" 
                              color="green.700" 
                              fontWeight="bold"
                            >
                              Montant: {typeof total === 'number' ? Math.floor(total) : total} FCFA
                            </Text>
                          </Box>
                          {o.created_at && <Text fontSize="xs" color="gray.500">Le {new Date(o.created_at).toLocaleString()}</Text>}
                          <VStack align="end" spacing={2} mt={3}>
                            {status !== 'expedie' && (
                              <HStack spacing={2}>
                                <Button size="sm" colorScheme="orange" onClick={() => handleCancel(o.id)}>Annuler</Button>
                                <Button size="sm" colorScheme="red" onClick={() => handleDelete(o.id)}>Supprimer</Button>
                              </HStack>
                            )}
                          </VStack>
                        </Box>
                        <Box textAlign="right">
                          {(() => {
                            const mapped = mapOrderStatus(String(status))
                            return <Badge colorScheme={mapped.color as any} fontSize="sm" py={1} px={3}>{mapped.label}</Badge>
                          })()}
                        </Box>
                      </HStack>
                    </Box>
                  </HStack>
                </Box>
              )
            })}
          </Stack>
        )}
    </Container>
  )
}
