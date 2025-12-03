import React, { useEffect, useState } from 'react'
import {
  Container,
  Heading,
  Text,
  Button,
  Box,
  Image,
  Flex,
  IconButton,
  Spinner,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Icon,
  Card,
  CardBody,
  SimpleGrid,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Avatar,
  Center,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import cart from '../utils/cart'
import { highRes, PRODUCT_PLACEHOLDER, SHOP_PLACEHOLDER } from '../utils/image'
import { getItem } from '../utils/localAuth'
import { 
  FiPackage, 
  FiShoppingBag, 
  FiSettings, 
  FiTrash2, 
  FiEdit2, 
  FiPlus, 
  FiEye, 
  FiBarChart2,
  FiActivity,
  FiTrendingUp,
  FiLayers,
  FiHome,
  FiUsers,
  FiDownload
} from 'react-icons/fi'

export default function SellerDashboard() {
  const nav = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Record<string, any>[]>([])
  const [sellerOrders, setSellerOrders] = useState<Record<string, any>[]>([])
  const [shop, setShop] = useState<Record<string, any> | null>(null)
  const [showMessages, setShowMessages] = useState<string | null>(null)
  const [orderMessages, setOrderMessages] = useState<Record<string, any[]>>({})
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({})
  const [sendingMessage, setSendingMessage] = useState<string | null>(null)
  const user = getItem('user') ? JSON.parse(getItem('user') as string) : null
 
  const cardBg = useColorModeValue('white', 'gray.900')
  const headingColor = useColorModeValue('gray.800', 'white')
  const textMuted = useColorModeValue('gray.600', 'gray.400')
  const navBg = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bgLight = useColorModeValue('gray.50', 'gray.800')

  useEffect(() => {
    let mounted = true

    api.products
      .list()
      .then((list: any[]) => {
        if (!mounted) return
        const mine = user ? list.filter((p) => String(p.seller_id) === String(user.id)) : []
        setProducts(mine)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))

    // Charger les commandes du vendeur
    if (user) {
      api.orders
        .sellerOrders(getItem('token') ?? undefined)
        .then((orders: any[]) => {
          if (!mounted) return
          setSellerOrders(orders || [])
        })
        .catch((e) => console.error('Failed to load seller orders', e))
    }

    // Shops removed - no longer fetching shop data
    if (mounted) setShop(null)

    return () => {
      mounted = false
    }
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      const token = getItem('token')
      await api.products.delete(id, token ?? undefined)
      // Refresh server cache so the deleted product disappears immediately from all listings
      try {
        await api.cache.refresh(token ?? undefined)
      } catch (e) {
        console.warn('Cache refresh after delete failed', e)
      }
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)))
      try {
        // Ensure removed product is also removed from the user's cart
        if (cart && typeof cart.remove === 'function') {
          cart.remove(String(id))
        }
      } catch (e) {
        console.warn('Failed to remove deleted product from cart', e)
      }
      try {
        // notify other parts of the app (product lists, caches) that a product was deleted
        if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
          globalThis.dispatchEvent(new CustomEvent('product:deleted', { detail: { id: String(id) } }))
        }
      } catch (e) {
        /* best-effort */
      }
      toast({
        title: '✅ Produit supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
    console.error('Delete product failed', err)
    // try to surface a helpful server message when available
    const e: any = err
    const serverMsg = e?.error || e?.message || (typeof e === 'string' ? e : null)
        // friendly mapping for common server errors
        const friendly = serverMsg === 'Forbidden'
          ? "Vous n'êtes pas autorisé à supprimer ce produit"
          : serverMsg === 'Not found' || serverMsg === 'Not Found'
            ? 'Produit introuvable'
            : serverMsg || 'Impossible de supprimer le produit'

        toast({
          title: 'Erreur',
          description: String(friendly),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
    }
  }

  async function handleOrderAction(orderId: string, action: 'accept' | 'reject' | 'preparing' | 'shipped' | 'delete') {
    const token = getItem('token')
    if (!token) return toast({ title: 'Erreur', description: 'Non authentifié', status: 'error' })

    try {
      if (action === 'delete') {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return
        await api.orders.delete(orderId, token)
        setSellerOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
        toast({ title: 'Commande supprimée', status: 'success' })
      } else {
        const statusMap = {
          'accept': 'accepted',
          'reject': 'rejected',
          'preparing': 'preparing',
          'shipped': 'shipped'
        }
        // Appel backend pour mettre à jour le statut
        await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: statusMap[action] })
        })
        
        setSellerOrders(prev => prev.map(o => 
          String(o.id) === String(orderId) 
            ? { ...o, status: statusMap[action] }
            : o
        ))
        const labelMap = {
          'accept': 'Commande acceptée',
          'reject': 'Commande refusée',
          'preparing': 'Commande en préparation',
          'shipped': 'Commande expédiée'
        }
        toast({ title: labelMap[action], status: 'success' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de modifier la commande', status: 'error' })
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

  function generateInvoicePDF(order: any) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .right { text-align: right; }
          .total-row { font-weight: bold; font-size: 16px; background-color: #f5f5f5; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-accepted { background-color: #d1fae5; color: #065f46; }
          .status-preparing { background-color: #bfdbfe; color: #1e40af; }
          .status-shipped { background-color: #d1fae5; color: #065f46; }
          .status-rejected { background-color: #fee2e2; color: #7f1d1d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Facture de Commande</h1>
          <p>Commande #${order.id?.slice(0, 8) || 'N/A'}</p>
        </div>

        <div class="section">
          <div class="section-title">INFORMATIONS DE COMMANDE</div>
          <table>
            <tr>
              <td><strong>Date:</strong></td>
              <td>${order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Statut:</strong></td>
              <td>
                <span class="status-badge status-${order.status || 'pending'}">
                  ${order.status === 'pending' ? 'En attente' :
                    order.status === 'accepted' ? 'Acceptée' :
                    order.status === 'preparing' ? 'En préparation' :
                    order.status === 'shipped' ? 'Expédiée' :
                    order.status === 'rejected' ? 'Refusée' :
                    order.status}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">CLIENT</div>
          <table>
            <tr>
              <td><strong>Nom:</strong></td>
              <td>${order.buyer_name || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Téléphone:</strong></td>
              <td>${order.buyer_phone || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Adresse:</strong></td>
              <td>${order.address || order.delivery_address || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">PRODUIT</div>
          <table>
            <tr>
              <td><strong>Produit:</strong></td>
              <td>${order.product_title || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Prix unitaire:</strong></td>
              <td class="right">${Math.floor(Number(order.price || 0))} FCFA</td>
            </tr>
            <tr>
              <td><strong>Quantité:</strong></td>
              <td class="right">${order.quantity || 1}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">LIVRAISON</div>
          <table>
            <tr>
              <td><strong>Type de livraison:</strong></td>
              <td>${order.delivery_type || 'Non spécifié'}</td>
            </tr>
            <tr>
              <td><strong>Frais de livraison:</strong></td>
              <td class="right">${Math.floor(Number(order.delivery_price || 0))} FCFA</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table>
            <tr class="total-row">
              <td><strong>TOTAL À PAYER:</strong></td>
              <td class="right"><strong>${Math.floor(Number(order.price || 0) + Number(order.delivery_price || 0))} FCFA</strong></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px;">
            Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `facture-${order.id?.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({ title: 'Facture téléchargée', status: 'success' })
  }

  // Statistiques simulées
  const stats = {
    totalProducts: products.length,
    totalViews: 0,
    totalSales: 0,
  }

  return (
    <Box minH="100vh" bg={navBg}>
      <Container maxW="container.lg" py={4} pb={{ base: '100px', md: 8 }}>

        {/* Header simplifié */}
        <Card mb={4} bg={navBg} borderRadius="xl" shadow="sm">
          <CardBody p={4}>
            <VStack spacing={3} align="stretch">
              <HStack spacing={3}>
                <Icon as={FiShoppingBag} boxSize={6} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={headingColor}>
                    Tableau de bord
                  </Heading>
                  <Text color={textMuted} fontSize="sm">
                    {shop ? shop.name : 'Votre activité'}
                  </Text>
                </VStack>
              </HStack>

              {/* Stats rapides */}
              <SimpleGrid columns={4} spacing={2}>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="800" color="blue.700">
                    {stats.totalProducts}
                  </Text>
                  <Text fontSize="2xs" color="blue.600">
                    Produits
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="800" color="green.700">
                    {stats.totalSales}
                  </Text>
                  <Text fontSize="2xs" color="green.600">
                    Ventes
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="800" color="purple.700">
                    {stats.totalViews}
                  </Text>
                  <Text fontSize="2xs" color="purple.600">
                    Vues
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Navigation tabs mobile optimisée */}
        <Tabs variant="soft-rounded" colorScheme="blue" isFitted>
          <TabList mb={4} bg={navBg} p={1} borderRadius="xl" shadow="sm">
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiBarChart2} boxSize={4} />
                <Text fontSize="2xs">Vue</Text>
              </VStack>
            </Tab>
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiUsers} boxSize={4} />
                <Text fontSize="2xs">Commandes</Text>
              </VStack>
            </Tab>
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiPackage} boxSize={4} />
                <Text fontSize="2xs">Produits</Text>
              </VStack>
            </Tab>
            <Tab 
              py={3}
              _selected={{ bg: 'blue.500', color: 'white' }}
              fontSize="sm"
            >
              <VStack spacing={0}>
                <Icon as={FiSettings} boxSize={4} />
                <Text fontSize="2xs">Actions</Text>
              </VStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Vue d'ensemble mobile */}
            <TabPanel p={0}>
              <VStack spacing={4} align="stretch">
                {/* Aperçu rapide */}
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Icon as={FiActivity} color="blue.500" />
                        <Text fontWeight="600">Aperçu</Text>
                      </HStack>
                      
                      <SimpleGrid columns={2} spacing={3}>
                        <Box p={3} bg="navBg" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="600" color="blue.700">
                            {products.length} produit{products.length > 1 ? 's' : ''}
                          </Text>
                          <Text fontSize="xs" color="blue.600">
                            {products.length > 0 ? '🟢 En ligne' : '🔴 Aucun'}
                          </Text>
                        </Box>
                        <Box p={3} bg="navBg" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="600" color="green.700">
                            {shop ? 'Active' : 'Inactive'}
                          </Text>
                          <Text fontSize="xs" color="green.600">
                            {shop ? '🟢 Boutique' : '🔴 À créer'}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Accès rapide */}
                <Card bg={navBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Icon as={FiLayers} color="purple.500" />
                        <Text fontWeight="600">Actions rapides</Text>
                      </HStack>
                      
                      <VStack spacing={2}>
                        <Button
                          leftIcon={<Icon as={FiPlus} />}
                          colorScheme="blue"
                          onClick={() => nav('/seller/product')}
                          w="100%"
                          size="sm"
                        >
                          Ajouter produit
                        </Button>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Activité récente */}
                <Card bg={navBg} borderRadius="xl" shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Icon as={FiTrendingUp} color="green.500" />
                        <Text fontWeight="600">Activité récente</Text>
                      </HStack>
                      
                      <VStack spacing={2} align="stretch">
                        {products.slice(0, 2).map((product, index) => (
                          <HStack key={product.id} p={2} bg={navBg} borderRadius="md">
                            <Avatar 
                              size="sm" 
                              src={highRes(product.image_url) ?? PRODUCT_PLACEHOLDER}
                              name={product.title}
                            />
                            <Box flex={1}>
                              <Text fontWeight="600" fontSize="xs" noOfLines={1}>
                                {product.title}
                              </Text>
                              <Text fontSize="2xs" color={textMuted}>
                                {Math.floor(product.price)} FCFA
                              </Text>
                            </Box>
                          </HStack>
                        ))}
                        {products.length === 0 && (
                          <Text color={textMuted} fontSize="sm" textAlign="center" py={2}>
                            Aucune activité
                          </Text>
                        )}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Tab 2: Commandes reçues mobile */}
            <TabPanel p={0}>
              {sellerOrders.length === 0 ? (
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={8} textAlign="center">
                    <Icon as={FiPackage} boxSize={8} color="gray.400" mb={3} />
                    <Text fontWeight="600" color={textMuted} mb={2}>
                      Aucune commande
                    </Text>
                    <Text color={textMuted} fontSize="sm">
                      Vous recevrez les commandes de vos clients ici
                    </Text>
                  </CardBody>
                </Card>
              ) : (
                <VStack spacing={4} align="stretch">
                  {sellerOrders.map((o) => {
                    const base = o.total_amount ?? o.price ?? o.amount ?? null
                    const displayTotal = (typeof base === 'number')
                      ? Math.floor(base + Number(o.delivery_price || 0))
                      : (base ?? '—')

                    const status = o.status ?? o.state ?? '—'
                    const image = o.product_image ?? (Array.isArray(o.items) && o.items[0]?.image) ?? null
                    const clientName = o.buyer_name ?? o.user_name ?? o.display_name ?? 'Utilisateur'
                    const clientPhone = o.buyer_phone ?? o.user_phone ?? o.phone ?? '—'
                    const productTitle = o.product_title ?? o.title ?? 'Produit'
                    const productPrice = o.price ?? o.product_price ?? 0

                    return (
                      <Card
                        key={o.id}
                        bg={cardBg}
                        borderRadius="xl"
                        shadow="sm"
                      >
                        <CardBody p={4}>
                          <VStack spacing={3} align="stretch">
                            {/* HEADER: ID + STATUS + DATE */}
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="700" fontSize="sm">
                                  Commande #{o.id?.slice(0, 8)}...
                                </Text>
                                {o.created_at && (
                                  <Text fontSize="xs" color={textMuted}>
                                    {new Date(o.created_at).toLocaleDateString('fr-FR')}
                                  </Text>
                                )}
                              </VStack>
                              <Badge
                                colorScheme={
                                  status === 'PENDING' ? 'yellow' :
                                  status === 'COMPLETED' ? 'green' :
                                  status === 'pending' ? 'yellow' :
                                  status === 'completed' ? 'green' :
                                  'blue'
                                }
                                fontSize="xs"
                                py={1}
                                px={3}
                                borderRadius="md"
                              >
                                {status === 'PENDING' || status === 'pending' ? 'En attente' :
                                 status === 'COMPLETED' || status === 'completed' ? 'Complétée' :
                                 status}
                              </Badge>
                            </HStack>

                            {/* CLIENT SECTION */}
                            <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                              <Text fontSize="xs" fontWeight="600" color={textMuted} mb={2}>CLIENT</Text>
                              <HStack spacing={2} align="start">
                                {clientName && (
                                  <Avatar
                                    size="sm"
                                    name={clientName}
                                    bg="yellow.400"
                                  />
                                )}
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="600" fontSize="sm">{clientName}</Text>
                                  <Text fontSize="xs" color={textMuted}>{clientPhone}</Text>
                                </VStack>
                              </HStack>
                            </Box>

                            {/* PRODUCT SECTION */}
                            <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                              <Text fontSize="xs" fontWeight="600" color={textMuted} mb={2}>PRODUIT</Text>
                              <HStack spacing={3} align="start">
                                {image && (
                                  <Image
                                    src={image}
                                    alt={productTitle}
                                    boxSize="50px"
                                    objectFit="cover"
                                    borderRadius="md"
                                    flexShrink={0}
                                  />
                                )}
                                <VStack align="start" spacing={1} flex="1">
                                  <Text fontWeight="600" fontSize="sm" noOfLines={1}>{productTitle}</Text>
                                  <Badge colorScheme="blue" fontSize="xs">
                                    {Math.floor(Number(productPrice))} FCFA
                                  </Badge>
                                  {o.quantity && <Text fontSize="xs" color={textMuted}>Qté: {o.quantity}</Text>}
                                </VStack>
                              </HStack>
                            </Box>

                            {/* DELIVERY SECTION */}
                            <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                              <Text fontSize="xs" fontWeight="600" color={textMuted} mb={2}>LIVRAISON</Text>
                              <VStack align="start" spacing={2}>
                                <HStack justify="space-between" width="100%">
                                  <Text fontSize="xs" color={textMuted}>Type</Text>
                                  <Text fontWeight="600" fontSize="sm">{o.delivery_type || o.shipping_method || '—'}</Text>
                                </HStack>
                                <HStack justify="space-between" width="100%">
                                  <Text fontSize="xs" color={textMuted}>Frais</Text>
                                  <Text fontWeight="600" fontSize="sm">{Math.floor(Number(o.delivery_price || 0))} FCFA</Text>
                                </HStack>
                                {(o.delivery_address || o.address) && (
                                  <Text fontSize="xs" color={textMuted}>
                                    Adresse: {o.delivery_address || o.address}
                                  </Text>
                                )}
                              </VStack>
                            </Box>

                            {/* TOTAL */}
                            <Box bg={bgLight} p={3} borderRadius="md" borderTopWidth="1px" borderTopColor={borderColor}>
                              <HStack justify="space-between">
                                <Text fontWeight="600" fontSize="sm">Total</Text>
                                <Text fontWeight="700" color="green.500" fontSize="lg">
                                  {displayTotal} FCFA
                                </Text>
                              </HStack>
                            </Box>

                            {/* MESSAGING SECTION */}
                            <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                              <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="blue"
                                w="100%"
                                onClick={() => handleToggleMessages(o.id)}
                                fontSize="xs"
                              >
                                💬 {showMessages === o.id ? 'Masquer' : 'Afficher'} messages
                              </Button>
                              {showMessages === o.id && (
                                <VStack spacing={2} mt={2} align="stretch">
                                  <Box maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md" borderColor={borderColor} p={2}>
                                    {orderMessages[o.id as string]?.length === 0 ? (
                                      <Text fontSize="xs" color={textMuted} textAlign="center">Aucun message</Text>
                                    ) : (
                                      <VStack spacing={1} align="stretch">
                                        {orderMessages[o.id as string]?.map((msg: any) => (
                                          <Box key={msg.id} bg={msg.sender_type === 'seller' ? 'blue.50' : 'gray.100'} p={2} borderRadius="md">
                                            <Text fontSize="xs" fontWeight="600">{msg.sender_type === 'seller' ? 'Vous' : 'Client'}</Text>
                                            <Text fontSize="xs">{msg.message}</Text>
                                            <Text fontSize="xs" color={textMuted}>
                                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                                            </Text>
                                          </Box>
                                        ))}
                                      </VStack>
                                    )}
                                  </Box>
                                  <HStack spacing={1} align="stretch">
                                    <input
                                      type="text"
                                      placeholder="Votre message..."
                                      style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: `1px solid ${borderColor}`,
                                        fontSize: '12px'
                                      }}
                                      value={messageInputs[o.id as string] || ''}
                                      onChange={(e) => setMessageInputs(prev => ({...prev, [o.id as string]: e.target.value}))}
                                    />
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      onClick={() => handleSendMessage(o.id)}
                                      isLoading={sendingMessage === o.id}
                                    >
                                      Envoyer
                                    </Button>
                                  </HStack>
                                </VStack>
                              )}
                            </Box>

                            {/* ACTIONS */}
                            <Box borderTopWidth="1px" borderTopColor={borderColor} pt={3}>
                              <VStack spacing={2} align="stretch">
                                {status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      colorScheme="green"
                                      w="100%"
                                      onClick={() => handleOrderAction(o.id, 'accept')}
                                    >
                                      ✓ Accepter la commande
                                    </Button>
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      variant="outline"
                                      w="100%"
                                      onClick={() => handleOrderAction(o.id, 'reject')}
                                    >
                                      ✕ Refuser
                                    </Button>
                                  </>
                                )}
                                
                                {(status === 'accepted' || status === 'ACCEPTED') && (
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    w="100%"
                                    onClick={() => handleOrderAction(o.id, 'preparing')}
                                  >
                                    ⚙ Préparer la commande
                                  </Button>
                                )}

                                {(status === 'preparing' || status === 'PREPARING') && (
                                  <Button
                                    size="sm"
                                    colorScheme="orange"
                                    w="100%"
                                    onClick={() => handleOrderAction(o.id, 'shipped')}
                                  >
                                    📦 Marquer expédiée
                                  </Button>
                                )}

                                {status === 'shipped' || status === 'SHIPPED' ? (
                                  <Box bg="green.50" p={2} borderRadius="md" textAlign="center">
                                    <Text fontSize="xs" fontWeight="600" color="green.700">
                                      ✓ Commande livrée
                                    </Text>
                                  </Box>
                                ) : null}

                                {(status === 'rejected' || status === 'REJECTED') && (
                                  <Box bg="red.50" p={2} borderRadius="md" textAlign="center">
                                    <Text fontSize="xs" fontWeight="600" color="red.700">
                                      ✕ Commande refusée
                                    </Text>
                                  </Box>
                                )}

                                <Button
                                  size="xs"
                                  colorScheme="gray"
                                  variant="ghost"
                                  w="100%"
                                  leftIcon={<Icon as={FiDownload} />}
                                  onClick={() => generateInvoicePDF(o)}
                                >
                                  📄 Télécharger facture
                                </Button>

                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  w="100%"
                                  onClick={() => handleOrderAction(o.id, 'delete')}
                                >
                                  🗑 Supprimer
                                </Button>
                              </VStack>
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    )
                  })}
                </VStack>
              )}
            </TabPanel>

            {/* Tab 3: Mes produits mobile */}
            <TabPanel p={0}>
              {products.length === 0 ? (
                <Card bg={cardBg} borderRadius="xl" shadow="sm">
                  <CardBody p={8} textAlign="center">
                    <Icon as={FiPackage} boxSize={8} color="gray.400" mb={3} />
                    <Text fontWeight="600" color={textMuted} mb={2}>
                      Aucun produit
                    </Text>
                    <Text color={textMuted} fontSize="sm" mb={4}>
                      Ajoutez votre premier produit
                    </Text>
                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FiPlus} />}
                      onClick={() => nav('/seller/product')}
                      size="sm"
                    >
                      Ajouter produit
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                <VStack spacing={3} align="stretch">
                  {products.map((p) => (
                    <Card
                      key={p.id}
                      bg={cardBg}
                      borderRadius="xl"
                      shadow="sm"
                      transition="all 0.2s"
                      _active={{ transform: 'scale(0.98)' }}
                    >
                      <CardBody p={3}>
                        <HStack spacing={3} align="start">
                          {/* Image produit */}
                          <Box
                            boxSize="60px"
                            bg="white"
                            borderRadius="lg"
                            overflow="hidden"
                            border="1px solid"
                            borderColor="gray.200"
                            flexShrink={0}
                          >
                            <Image
                              src={highRes(p.image_url) ?? PRODUCT_PLACEHOLDER}
                              alt={p.title}
                              objectFit="cover"
                              w="100%"
                              h="100%"
                            />
                          </Box>

                          {/* Infos produit */}
                          <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                              {p.title}
                            </Text>
                            <Text color={textMuted} fontSize="xs" noOfLines={1}>
                              {p.description || 'Aucune description'}
                            </Text>
                            
                            <HStack spacing={2}>
                              <Badge colorScheme="green" fontSize="xs">
                                {Math.floor(p.price)} FCFA
                              </Badge>
                              {p.quantity > 0 ? (
                                <Badge colorScheme="blue" fontSize="xs">
                                  {p.quantity} en stock
                                </Badge>
                              ) : (
                                <Badge colorScheme="red" fontSize="xs">
                                  Rupture
                                </Badge>
                              )}
                            </HStack>
                          </VStack>

                          {/* Actions */}
                          <VStack spacing={1}>
                            <IconButton
                              aria-label="Modifier"
                              icon={<Icon as={FiEdit2} />}
                              onClick={() => nav(`/seller/product/${p.id}`)}
                              variant="ghost"
                              colorScheme="blue"
                              size="sm"
                              boxSize={8}
                            />
                            <IconButton
                              aria-label="Supprimer"
                              icon={<Icon as={FiTrash2} />}
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDelete(String(p.id))}
                              size="sm"
                              boxSize={8}
                            />
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Tab 4: Actions mobile */}
            <TabPanel p={0}>
              <VStack spacing={3} align="stretch">
                {/* Ajouter produit */}
                <Card
                  bg={cardBg}
                  borderRadius="xl"
                  shadow="sm"
                  onClick={() => nav('/seller/product')}
                  cursor="pointer"
                  transition="all 0.2s"
                  _active={{ transform: 'scale(0.98)' }}
                >
                  <CardBody p={4}>
                    <HStack spacing={3}>
                      <Icon as={FiPlus} boxSize={5} color="green.500" />
                      <VStack spacing={0} align="start" flex={1}>
                        <Text fontWeight="600">Ajouter produit</Text>
                        <Text color={textMuted} fontSize="sm">
                          Nouveau produit au catalogue
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Voir boutique */}
                {shop && (
                  <Card
                    bg={cardBg}
                    borderRadius="xl"
                    shadow="sm"
                    onClick={() => nav('/seller/shop')}
                    cursor="pointer"
                    transition="all 0.2s"
                    _active={{ transform: 'scale(0.98)' }}
                  >
                    <CardBody p={4}>
                      <HStack spacing={3}>
                        <Icon as={FiEye} boxSize={5} color="purple.500" />
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontWeight="600">Voir boutique</Text>
                          <Text color={textMuted} fontSize="sm">
                            Comme vos clients la voient
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                )}

                {/* Supprimer boutique */}
                {shop && (
                  <Card
                    bg={cardBg}
                    borderRadius="xl"
                    shadow="sm"
                    cursor="pointer"
                    transition="all 0.2s"
                    _active={{ transform: 'scale(0.98)' }}
                    borderColor="red.200"
                  >
                    <CardBody p={4}>
                      <HStack spacing={3}>
                        <Icon as={FiTrash2} boxSize={5} color="red.500" />
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontWeight="600" color="red.600">
                            Supprimer boutique
                          </Text>
                          <Text color="red.400" fontSize="sm">
                            Action irréversible
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  )
}