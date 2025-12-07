import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Spinner, Button, useToast, HStack, Badge, VStack, Icon, useColorModeValue, Input, Divider } from '@chakra-ui/react'
import { FiMessageCircle, FiSend } from 'react-icons/fi'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import mapOrderStatus from '../utils/status'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMessages, setShowMessages] = useState<string | null>(null)
  const [orderMessages, setOrderMessages] = useState<Record<string, any[]>>({})
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({})
  const [sendingMessage, setSendingMessage] = useState<string | null>(null)
  const messagesEndRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const toast = useToast()
  
  // Color scheme for messaging
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bgLight = useColorModeValue('gray.50', 'gray.800')
  const textMuted = useColorModeValue('gray.600', 'gray.400')
  const msgBgUser = useColorModeValue('blue.500', 'blue.600')
  const msgBgVendor = useColorModeValue('gray.200', 'gray.600')
  const msgTextUser = useColorModeValue('white', 'white')
  const msgTextVendor = useColorModeValue('gray.900', 'gray.100')
  const inputBg = useColorModeValue('white', 'gray.700')
  const messagingBg = useColorModeValue('gray.50', 'gray.900')
  const messageContainerBg = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('white', 'gray.800')
  const cardBorder = useColorModeValue('gray.200', 'gray.700')
  const titleColor = useColorModeValue('black', 'white')
  const productColor = useColorModeValue('gray.700', 'gray.300')
  const dateColor = useColorModeValue('gray.500', 'gray.400')

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    Object.values(messagesEndRefs.current).forEach((el) => {
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 0)
    })
  }, [orderMessages])

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

  async function handleToggleMessages(orderId: string) {
    if (showMessages === orderId) {
      setShowMessages(null)
      return
    }
    
    setShowMessages(orderId)
    
    // Load messages if not already loaded
    if (!orderMessages[orderId as string]) {
      try {
        const token = getItem('token')
        if (!token) return
        const msgs = await api.orders.getMessages(orderId, token)
        setOrderMessages(prev => ({...prev, [orderId]: msgs || []}))
      } catch (err) {
        console.error('Failed to load messages', err)
        toast({ title: 'Erreur', description: 'Impossible de charger les messages', status: 'error' })
      }
    }
  }

  async function handleSendMessage(orderId: string) {
    const msg = messageInputs[orderId as string]?.trim()
    if (!msg) return

    setSendingMessage(orderId)
    try {
      const token = getItem('token')
      if (!token) return
      
      await api.orders.sendMessage(orderId, { message: msg }, token)
      setMessageInputs(prev => ({...prev, [orderId]: ''}))
      
      // Reload messages
      const msgs = await api.orders.getMessages(orderId, token)
      setOrderMessages(prev => ({...prev, [orderId]: msgs || []}))
      
      toast({ title: 'Message envoyé', status: 'success' })
    } catch (err) {
      console.error('Failed to send message', err)
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le message', status: 'error' })
    } finally {
      setSendingMessage(null)
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
    const base = o.total ?? o.price ?? o.amount ?? null
    const displayTotal = (typeof base === 'number')
      ? Math.floor(base + Number(o.delivery_price || 0))
      : (base ?? '—')

    const status = o.status ?? o.state ?? '—'
    const image = o.product_image ?? (Array.isArray(o.items) && o.items[0]?.image) ?? null

    return (
      <Box
        key={o.id}
        bg={cardBg}
        borderRadius="lg"
        p={{ base: 3, md: 4 }}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={cardBorder}
      >
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={{ base: 3, md: 4 }}
        >
          {/* IMAGE */}
          {image && (
            <Box
              flexShrink={0}
              borderRadius="md"
              overflow="hidden"
              boxShadow="xs"
              alignSelf={{ base: "center", md: "flex-start" }}
            >
              <img
                src={image}
                alt="product"
                style={{
                  width: 90,
                  height: 90,
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 8
                }}
              />
            </Box>
          )}

          {/* INFO PRINCIPALE */}
          <Box flex="1" width="100%">
            {/* TITRE + STATUT */}
            <HStack justify="space-between" align="start" mb={1}>
              <Text fontWeight="700" fontSize={{ base: "md", md: "lg" }} color={titleColor}>
                Commande
              </Text>

              <Box textAlign="right">
                {(() => {
                  const mapped = mapOrderStatus(String(status))
                  return (
                    <Badge
                      colorScheme={mapped.color}
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

            {/* PRODUITS */}
            <Text
              mt={2}
              fontSize="sm"
              color={productColor}
              whiteSpace="normal"
              wordBreak="break-word"
            >
              {Array.isArray(o.items)
                ? o.items.map((it: any) => it.title || it.product_title || it.name).join(', ')
                : (o.product_title || o.title || '—')}
            </Text>

            {/* PRIX */}
            <Box
              bg="green.50"
              display="inline-block"
              px={2}
              py={1}
              borderRadius="md"
              mt={3}
            >
              <Text fontSize="md" color="green.700" fontWeight="bold">
                Montant : {displayTotal} FCFA
              </Text>
            </Box>

            {/* DATE */}
            {o.created_at && (
              <Text fontSize="xs" color={dateColor} mt={1}>
                Le {new Date(o.created_at).toLocaleString()}
              </Text>
            )}

            {/* BOUTONS ACTIONS */}
            {status !== "expedie" && (
              <Stack
                mt={4}
                direction={{ base: "column", md: "row" }}
                spacing={2}
                width="100%"
              >
                <Button
                  size="sm"
                  colorScheme="orange"
                  width={{ base: "100%", md: "auto" }}
                  onClick={() => handleCancel(o.id)}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  width={{ base: "100%", md: "auto" }}
                  onClick={() => handleDelete(o.id)}
                >
                  Supprimer
                </Button>
              </Stack>
            )}

            {/* MESSAGING SECTION */}
            <Box mt={4} pt={3}>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="blue"
                w="100%"
                leftIcon={<Icon as={FiMessageCircle} />}
                onClick={() => handleToggleMessages(o.id)}
                fontSize="sm"
                fontWeight="600"
                justifyContent="flex-start"
              >
                💬 {showMessages === o.id ? 'Masquer les messages' : 'Afficher les messages'}
              </Button>
              
              {showMessages === o.id && (
                <Box mt={3} borderRadius="lg" bg={messagingBg} p={3} boxShadow="inset 0 2px 4px rgba(0,0,0,0.05)">
                  {/* Messages Container */}
                  <Box 
                    maxH="300px" 
                    overflowY="auto" 
                    mb={3}
                    borderRadius="md"
                    bg={messageContainerBg}
                    p={3}
                    borderWidth="1px"
                    borderColor={borderColor}
                    css={{
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#cbd5e0',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: '#a0aec0',
                      },
                    }}
                  >
                    {orderMessages[o.id as string]?.length === 0 ? (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="sm" color={textMuted}>
                          📭 Aucun message pour le moment
                        </Text>
                      </Box>
                    ) : (
                      <VStack spacing={2} align="stretch">
                        {orderMessages[o.id as string]?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((msg: any, idx: number) => {
                          const isUser = msg.sender_type === 'buyer'
                          const isLast = idx === (orderMessages[o.id as string]?.length ?? 0) - 1
                          return (
                            <Box
                              key={msg.id}
                              ref={(el) => {
                                if (isLast && el) messagesEndRefs.current[o.id] = el
                              }}
                              display="flex"
                              justifyContent={isUser ? 'flex-end' : 'flex-start'}
                            >
                              <Box
                                maxW="85%"
                                bg={isUser ? msgBgUser : msgBgVendor}
                                color={isUser ? msgTextUser : msgTextVendor}
                                px={3}
                                py={2}
                                borderRadius={isUser ? "lg 0 lg lg" : "0 lg lg lg"}
                                boxShadow="sm"
                              >
                                <Text fontSize="xs" fontWeight="600" opacity="0.8" mb={1}>
                                  {isUser ? '👤 Vous' : '🏪 Vendeur'}
                                </Text>
                                <Text fontSize="sm" wordBreak="break-word">
                                  {msg.message}
                                </Text>
                                <Text 
                                  fontSize="xs" 
                                  opacity="0.7" 
                                  mt={1}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                                </Text>
                              </Box>
                            </Box>
                          )
                        })}
                      </VStack>
                    )}
                  </Box>
                  
                  {/* Input Area */}
                  <HStack spacing={2} align="stretch">
                    <Input
                      placeholder="Écrivez un message..."
                      size="sm"
                      bg={inputBg}
                      borderColor={borderColor}
                      borderWidth="1px"
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px blue.500',
                      }}
                      value={messageInputs[o.id as string] || ''}
                      onChange={(e) => setMessageInputs(prev => ({...prev, [o.id as string]: e.target.value}))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(o.id)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleSendMessage(o.id)}
                      isLoading={sendingMessage === o.id}
                      leftIcon={<Icon as={FiSend} />}
                      borderRadius="md"
                    >
                      Envoyer
                    </Button>
                  </HStack>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    )
  })}
</Stack>

        )}
    </Container>
  )
}
