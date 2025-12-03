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
  const borderColor = useColorModeValue('gray.200', 'gray.700')

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
        <Stack spacing={4}>
          {orders.map((o) => {
            const base = o.total ?? o.price ?? o.amount ?? null
            const displayTotal = (typeof base === 'number')
              ? Math.floor(base + Number(o.delivery_price || 0))
              : (base ?? '—')

            const status = o.status ?? o.state ?? '—'
            const image = o.product_image ?? (Array.isArray(o.items) && o.items[0]?.image) ?? null
            const clientName = o.buyer_name ?? o.user_name ?? 'Utilisateur'
            const clientPhone = o.buyer_phone ?? o.user_phone ?? '—'
            const productTitle = o.product_title ?? o.title ?? 'Produit'
            const productPrice = o.price ?? o.product_price ?? 0

            return (
              <Box
                key={o.id}
                bg={sectionBg}
                borderRadius="lg"
                p={{ base: 3, md: 4 }}
                boxShadow="sm"
                borderWidth="1px"
              >
                <Stack spacing={3}>
                  {/* HEADER: ID + STATUS + DATE */}
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="700" fontSize={{ base: "md", md: "lg" }}>
                        Commande #{o.id?.slice(0, 8)}...
                      </Text>
                      {o.created_at && (
                        <Text fontSize="xs" color="gray.500">
                          {new Date(o.created_at).toLocaleDateString('fr-FR')}
                        </Text>
                      )}
                    </VStack>
                    <Box textAlign="right">
                      {(() => {
                        const mapped = mapOrderStatus(String(status))
                        return (
                          <Badge
                            colorScheme={mapped.color as any}
                            fontSize="xs"
                            py={1}
                            px={3}
                            borderRadius="md"
                          >
                            {mapped.label}
                          </Badge>
                        )
                      })()}
                    </Box>
                  </HStack>

                  {/* CLIENT SECTION */}
                  <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                    <Text fontSize="xs" fontWeight="600" color="gray.600" mb={2}>CLIENT</Text>
                    <HStack spacing={2} align="start">
                      {clientName && (
                        <Box
                          w={8}
                          h={8}
                          borderRadius="full"
                          bg="yellow.400"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Text fontWeight="700" fontSize="sm" color="white">
                            {clientName?.charAt(0).toUpperCase() || 'C'}
                          </Text>
                        </Box>
                      )}
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600">{clientName}</Text>
                        <Text fontSize="sm" color="gray.600">{clientPhone}</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* PRODUCT SECTION */}
                  <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                    <Text fontSize="xs" fontWeight="600" color="gray.600" mb={2}>PRODUIT</Text>
                    <HStack spacing={3} align="start">
                      {image && (
                        <Image
                          src={image}
                          alt={productTitle}
                          boxSize="60px"
                          objectFit="cover"
                          borderRadius="md"
                          flexShrink={0}
                        />
                      )}
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontWeight="600">{productTitle}</Text>
                        <Box bg="blue.50" display="inline-block" px={2} py={1} borderRadius="md">
                          <Text fontSize="sm" color="blue.700" fontWeight="bold">
                            {Math.floor(Number(productPrice))} FCFA
                          </Text>
                        </Box>
                        {o.quantity && <Text fontSize="sm" color="gray.600">Qté: {o.quantity}</Text>}
                      </VStack>
                    </HStack>
                  </Box>

                  {/* DELIVERY SECTION */}
                  <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                    <Text fontSize="xs" fontWeight="600" color="gray.600" mb={2}>LIVRAISON</Text>
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" width="100%">
                        <Text fontSize="sm" color="gray.600">Type</Text>
                        <Text fontWeight="600">{o.delivery_type || o.shipping_method || '—'}</Text>
                      </HStack>
                      {(o.delivery_address || o.address) && (
                        <Text fontSize="sm" color="gray.600">
                          Adresse: {o.delivery_address || o.address}
                        </Text>
                      )}
                    </VStack>
                  </Box>

                  {/* TOTAL */}
                  <Box bg="gray.50" p={3} borderRadius="md" borderTopWidth="1px" borderTopColor={borderColor}>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Total</Text>
                      <Text fontWeight="700" color="green.600" fontSize="lg">
                        {displayTotal} FCFA
                      </Text>
                    </HStack>
                  </Box>

                  {/* ACTIONS */}
                  <HStack mt={2} spacing={3}>
                    <Button
                      size="sm"
                      colorScheme={shipped[String(o.id)] ? 'green' : 'brand'}
                      onClick={() => {
                        const key = String(o.id)
                        setShipped(s => ({ ...s, [key]: !s[key] }))
                        toast({ title: shipped[String(o.id)] ? 'Expédition annulée' : 'Marqué expédiée', status: 'success' })
                      }}
                    >
                      {shipped[String(o.id)] ? 'Annuler expédition' : 'Marquer expédiée'}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDelete(o.id)}
                    >
                      Supprimer
                    </Button>
                  </HStack>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </Container>
  )
}
