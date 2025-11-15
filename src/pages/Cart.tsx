import React, { useEffect, useState } from 'react'
import { 
  Container, Heading, Stack, Box, Text, Button, NumberInput, 
  NumberInputField, NumberInputStepper, NumberIncrementStepper, 
  NumberDecrementStepper, HStack, Image, useToast, IconButton, 
  useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, ModalCloseButton, FormControl, FormLabel, 
  Input, Textarea, useDisclosure, VStack, Divider, Flex, RadioGroup, 
  Radio, List, ListItem 
} from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'
import cart from '../utils/cart'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import { useNavigate } from 'react-router-dom'

export default function CartPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const nav = useNavigate()
  const { isOpen: isCheckoutOpen, onOpen: onOpenCheckout, onClose: onCloseCheckout } = useDisclosure()

  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [shippingType, setShippingType] = useState<'auto' | 'local' | 'regional' | 'express'>('auto')
  const [deliveryBreakdown, setDeliveryBreakdown] = useState<{ [key: string]: number }>({})
  const [deliveryTotal, setDeliveryTotal] = useState(0)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const mutedText = useColorModeValue('gray.600', 'gray.400')
    const [deliveryShopNames, setDeliveryShopNames] = useState<{ [key: string]: string }>({})

  // Charger les articles du panier
  useEffect(() => {
    setItems(cart.list())
    
    const handleCartChange = () => { 
      setItems(cart.list()) 
    }
    
    if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('cart:changed', handleCartChange)
      return () => globalThis.removeEventListener('cart:changed', handleCartChange)
    }
    
    return () => {}
  }, [])

    // Recompute shipping whenever cart items, chosen shipping type or address change
    useEffect(() => {
      // loadShippingData is declared below and is a function declaration (hoisted)
      ;(async () => {
        try {
          await loadShippingData(buyerAddress, shippingType)
        } catch (e) {
          // ignore errors for background update
        }
      })()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, shippingType, buyerAddress])

  // Gestion des quantités
  const setQty = (id: string, q: number) => { 
    cart.updateQuantity(id, q); 
    setItems(cart.list()) 
  }

  const remove = (id: string) => { 
    cart.remove(id); 
    setItems(cart.list()) 
  }

  // Pré-remplir les infos utilisateur
  const prefillUserInfo = () => {
    try {
      const userData = getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setBuyerName(user.display_name ?? user.name ?? user.full_name ?? '')
        setBuyerPhone(user.phone ?? user.phone_number ?? '')
      }
    } catch (e) {
      console.debug('Error parsing user data', e)
    }
  }

  // Ouvrir le checkout
  const checkout = async () => {
    if (items.length === 0) {
      toast({ 
        title: 'Votre panier est vide', 
        status: 'info', 
        duration: 2000 
      })
      return
    }

    prefillUserInfo()
    
    try {
      await loadShippingData(buyerAddress, 'auto')
    } catch (e) {
      console.debug('Failed to preload shipping data', e)
    }
    
    onOpenCheckout()
  }

  // Calculer les frais de livraison
  const loadShippingData = async (address: string, forcedType: 'auto' | 'local' | 'regional' | 'express' = 'auto') => {
    try {
      const itemsLocal = cart.list()
      if (itemsLocal.length === 0) {
        setDeliveryBreakdown({})
        setDeliveryTotal(0)
        return
      }

      // Récupérer les détails des produits
      const productPromises = itemsLocal.map((it) => api.products.get(it.id))
      const products = await Promise.all(productPromises)

      // Récupérer les boutiques
      const shops = await api.shops.list()
      const shopByOwner: { [key: string]: any } = {}
      shops?.forEach((s: any) => { 
        shopByOwner[String(s.owner_id)] = s 
      })

      const perShop: { [key: string]: number } = {}
    const shopNames: { [key: string]: string } = {}
      
      // Déterminer le type de livraison
      const determineType = (addr: string) => {
        if (forcedType !== 'auto') return forcedType
        if (!addr) return 'regional'
        return /dakar/i.test(addr) ? 'local' : 'regional'
      }

      const chosenType = determineType(address)
      const seenOwners = new Set<string>()

      for (let i = 0; i < itemsLocal.length; i++) {
        const it = itemsLocal[i]
        const prod = products[i] || {}
        const ownerId = String(prod.seller_id || prod.owner_id || '')
        
        if (!ownerId || seenOwners.has(ownerId)) continue
        
        seenOwners.add(ownerId)
        let price = 0
        let shop = shopByOwner[ownerId]
        // If cached shop looks stale (missing delivery fields), try fetching fresh shop by owner
        if (shop && (typeof shop.delivery_price_local === 'undefined' || typeof shop.delivery_price_regional === 'undefined' || typeof shop.delivery_price_express === 'undefined')) {
          try {
            const fresh = await api.shops.getByOwner(ownerId)
            if (fresh) shop = fresh
          } catch (e) {
            // ignore and fallback to cached shop
          }
        }
        if (shop) {
          if (chosenType === 'local') price = Number(shop.delivery_price_local || 0)
          else if (chosenType === 'regional') price = Number(shop.delivery_price_regional || 0)
          else if (chosenType === 'express') price = Number(shop.delivery_price_express || 0)
        }
        perShop[ownerId] = price
        shopNames[ownerId] = shop?.owner_display_name || shop?.name || `Vendeur`
      }

      const total = Object.values(perShop).reduce((s, v) => s + (Number(v) || 0), 0)
      setDeliveryBreakdown(perShop)
        setDeliveryShopNames(shopNames)
      setDeliveryTotal(total)
      setShippingType(chosenType)
    } catch (err) {
      console.error('Failed to compute shipping', err)
      setDeliveryBreakdown({})
      setDeliveryTotal(0)
    }
  }

  // Confirmer la commande
  const confirmCheckout = async () => {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      toast({ 
        title: 'Informations requises', 
        description: 'Veuillez compléter tous les champs obligatoires', 
        status: 'warning', 
        duration: 3000 
      })
      return
    }

    setLoading(true)
    
    try {
      const token = getItem('token') ?? undefined
      const userData = getItem('user')
      const user = userData ? JSON.parse(userData) : null
      const buyer_id = user ? user.id : null

      const itemsLocal = items
      const products = await Promise.all(itemsLocal.map((it) => api.products.get(it.id)))
      const shopList = await api.shops.list()
      
      const shopByOwner: { [key: string]: any } = {}
      shopList?.forEach((s: any) => { 
        shopByOwner[String(s.owner_id)] = s 
      })

      const sellerCharged: { [key: string]: boolean } = {};
      // ensure we have shop names available after confirm path too
      const shopNamesConfirm: { [key: string]: string } = {};
  ;(shopList || []).forEach((s: any) => { shopNamesConfirm[String(s.owner_id)] = s.owner_display_name || s.name || `Vendeur` });
      setDeliveryShopNames(shopNamesConfirm);

      const promises = itemsLocal.map((it, idx) => {
        const prod = products[idx] || {}
        const ownerId = String(prod.seller_id || prod.owner_id || '')
        let deliveryPriceForThisItem = 0
        
        if (ownerId && !sellerCharged[ownerId]) {
          const shop = shopByOwner[ownerId]
          if (shop) {
            if (shippingType === 'local') deliveryPriceForThisItem = Number(shop.delivery_price_local || 0)
            else if (shippingType === 'regional') deliveryPriceForThisItem = Number(shop.delivery_price_regional || 0)
            else if (shippingType === 'express') deliveryPriceForThisItem = Number(shop.delivery_price_express || 0)
          }
          sellerCharged[ownerId] = true
        }

        const payload: any = {
          product_id: it.id,
          product_title: it.title,
          price: it.price,
          payment_method: 'cash_on_delivery',
          buyer_name: buyerName || null,
          buyer_phone: buyerPhone || null,
          address: buyerAddress || null,
          product_image: it.image || null,
          delivery_price: deliveryPriceForThisItem || 0,
        }
        
        if (buyer_id) payload.buyer_id = buyer_id
        
        return api.orders.create(payload, token)
      })

      await Promise.all(promises)
      
      toast({ 
        title: 'Commande confirmée', 
        description: 'Vous recevrez une confirmation par téléphone',
        status: 'success', 
        duration: 3000 
      })
      
      cart.clear()
      setItems([])
      onCloseCheckout()
      nav('/orders')
    } catch (err) {
      console.error(err)
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de finaliser votre commande', 
        status: 'error',
        duration: 3000 
      })
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <Container maxW="1200px" py={10} pb={{ base: '140px', md: 10 }}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box borderBottom="1px solid" borderColor={borderColor} pb={4}>
          <Heading 
            size="2xl" 
            fontWeight="300"
            letterSpacing="-0.02em"
            color={useColorModeValue('black', 'white')}
            textTransform="uppercase"
          >
            Panier
          </Heading>
          <Text color={mutedText} fontSize="sm" mt={1} fontWeight="400" letterSpacing="0.5px">
            {items.length === 0 ? '0 article' : `${items.length} article${items.length > 1 ? 's' : ''}`}
          </Text>
        </Box>

        {items.length === 0 ? (
          <EmptyCart onContinueShopping={() => nav('/')} />
        ) : (
          <CartWithItems 
            items={items}
            onSetQty={setQty}
            onRemove={remove}
            onCheckout={checkout}
            onContinueShopping={() => nav(-1)}
            onClearCart={() => { cart.clear(); setItems([]); }}
            deliveryTotal={deliveryTotal}
            cardBg={cardBg}
            borderColor={borderColor}
            mutedText={mutedText}
            loading={loading}
          />
        )}
      </VStack>

      {/* Modal de checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={onCloseCheckout}
        buyerName={buyerName}
        setBuyerName={setBuyerName}
        buyerPhone={buyerPhone}
        setBuyerPhone={setBuyerPhone}
        buyerAddress={buyerAddress}
        setBuyerAddress={setBuyerAddress}
        shippingType={shippingType}
        setShippingType={setShippingType}
        deliveryBreakdown={deliveryBreakdown}
          deliveryShopNames={deliveryShopNames}
        onLoadShippingData={loadShippingData}
        onConfirmCheckout={confirmCheckout}
        loading={loading}
        cardBg={cardBg}
        borderColor={borderColor}
        mutedText={mutedText}
      />
    </Container>
  )
}

// Composant pour le panier vide
const EmptyCart = ({ onContinueShopping }: { onContinueShopping: () => void }) => (
  <Box py={20} textAlign="center">
    <Text 
      fontSize="lg" 
      color="gray.600"
      fontWeight="300"
      letterSpacing="0.5px"
      mb={8}
    >
      Votre panier est actuellement vide
    </Text>
    <Button
      size="lg"
      bg="black"
      color="white"
      _hover={{ bg: 'gray.800' }}
      onClick={onContinueShopping}
      fontWeight="400"
      letterSpacing="1px"
      px={12}
      h="56px"
      textTransform="uppercase"
      fontSize="sm"
    >
      Découvrir la collection
    </Button>
  </Box>
)

// Composant pour le panier avec articles
const CartWithItems = ({
  items,
  onSetQty,
  onRemove,
  onCheckout,
  onContinueShopping,
  onClearCart,
  deliveryTotal,
  cardBg,
  borderColor,
  mutedText,
  loading
}: any) => (
  <Flex direction={{ base: 'column', lg: 'row' }} gap={8} align="flex-start">
    {/* Liste des articles */}
    <VStack flex="1" spacing={0} align="stretch">
      {items.map((it: any) => (
        <CartItem 
          key={it.id}
          item={it}
          onSetQty={onSetQty}
          onRemove={onRemove}
          borderColor={borderColor}
          mutedText={mutedText}
        />
      ))}
    </VStack>

    {/* Résumé */}
    <CartSummary
      deliveryTotal={deliveryTotal}
      onCheckout={onCheckout}
      onContinueShopping={onContinueShopping}
      onClearCart={onClearCart}
      loading={loading}
      cardBg={cardBg}
      borderColor={borderColor}
      mutedText={mutedText}
    />
  </Flex>
)

// Composant pour un article du panier
const CartItem = ({ item, onSetQty, onRemove, borderColor, mutedText }: any) => (
  <Box borderBottom="1px solid" borderColor={borderColor} py={6}>
    <Flex gap={6} align="flex-start">
      <Box position="relative" flexShrink={0}>
        <Image 
          src={item.image ?? undefined} 
          w={{ base: '100px', md: '140px' }}
          h={{ base: '130px', md: '180px' }}
          objectFit="cover" 
          alt={item.title}
        />
      </Box>
      
      <VStack flex="1" align="stretch" spacing={3}>
        <Flex justify="space-between" align="flex-start">
          <Box flex="1">
            <Text 
              fontWeight="400" 
              fontSize="md" 
              color="black"
              letterSpacing="0.3px"
              mb={1}
            >
              {item.title}
            </Text>
            <Text 
              fontSize="md" 
              color="black"
              fontWeight="400"
              mt={2}
            >
              {Math.floor(item.price ?? 0)} FCFA
            </Text>
          </Box>
          
          <IconButton 
            aria-label="Supprimer" 
            icon={<CloseIcon boxSize={3} />}
            size="sm"
            variant="ghost"
            color={mutedText}
            onClick={() => onRemove(item.id)}
            _hover={{ color: 'black' }}
            minW="auto"
          />
        </Flex>

        <HStack spacing={4} mt={2}>
          <Box>
            <Text fontSize="xs" color={mutedText} mb={1} textTransform="uppercase" letterSpacing="1px">
              Quantité
            </Text>
            <NumberInput 
              size="sm" 
              maxW="90px" 
              value={String(item.quantity)} 
              min={1}
              onChange={(_, v) => onSetQty(item.id, Number(v))}
            >
              <NumberInputField 
                borderColor={borderColor}
                _focus={{ borderColor: 'black' }}
                fontWeight="400"
              />
              <NumberInputStepper>
                <NumberIncrementStepper borderColor={borderColor} />
                <NumberDecrementStepper borderColor={borderColor} />
              </NumberInputStepper>
            </NumberInput>
          </Box>
        </HStack>
      </VStack>
    </Flex>
  </Box>
)

// Composant pour le résumé du panier
const CartSummary = ({
  deliveryTotal,
  onCheckout,
  onContinueShopping,
  onClearCart,
  loading,
  cardBg,
  borderColor,
  mutedText
}: any) => (
  <Box w={{ base: 'full', lg: '380px' }} position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '20px' }} flexShrink={0}>
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} p={6}>
      <VStack spacing={5} align="stretch">
        <Text fontSize="lg" fontWeight="400" textTransform="uppercase" letterSpacing="1px">
          Récapitulatif
        </Text>
        
        <Divider borderColor={borderColor} />
        
        <Flex justify="space-between" py={2}>
          <Text fontSize="sm" color={mutedText} textTransform="uppercase" letterSpacing="0.5px">
            Sous-total
          </Text>
          <Text fontSize="sm" fontWeight="400">
            {Math.floor(cart.getTotal())} FCFA
          </Text>
        </Flex>

        <Flex justify="space-between" py={2}>
          <Text fontSize="sm" color={mutedText} textTransform="uppercase" letterSpacing="0.5px">
            Livraison
          </Text>
          <Text fontSize="sm" fontWeight="400">
            {deliveryTotal > 0 ? `${Math.floor(deliveryTotal)} FCFA` : 'À déterminer'}
          </Text>
        </Flex>

        <Divider borderColor={borderColor} />

        <Flex justify="space-between" align="center" py={2}>
          <Text fontSize="md" fontWeight="400" textTransform="uppercase" letterSpacing="1px">
            Total
          </Text>
          <Text fontSize="xl" fontWeight="400">
            {Math.floor(cart.getTotal() + deliveryTotal)} FCFA
          </Text>
        </Flex>

        <Button
          w="full"
          size="lg"
          bg="black"
          color="white"
          _hover={{ bg: 'gray.800' }}
          onClick={onCheckout}
          isLoading={loading}
          fontWeight="400"
          letterSpacing="1px"
          h="56px"
          textTransform="uppercase"
          fontSize="sm"
        >
          Commander
        </Button>

        <Button
          w="full"
          variant="outline"
          size="lg"
          borderColor={borderColor}
          color="black"
          _hover={{ bg: 'gray.50' }}
          onClick={onContinueShopping}
          fontWeight="400"
          letterSpacing="1px"
          h="56px"
          textTransform="uppercase"
          fontSize="sm"
        >
          Continuer mes achats
        </Button>

        <Button
          w="full"
          variant="ghost"
          size="sm"
          color={mutedText}
          _hover={{ color: 'black' }}
          onClick={onClearCart}
          fontWeight="400"
          letterSpacing="0.5px"
          textTransform="uppercase"
          fontSize="xs"
        >
          Vider le panier
        </Button>
      </VStack>
    </Box>
  </Box>
)

// Composant pour le modal de checkout
const CheckoutModal = ({
  isOpen,
  onClose,
  buyerName,
  setBuyerName,
  buyerPhone,
  setBuyerPhone,
  buyerAddress,
  setBuyerAddress,
  shippingType,
  setShippingType,
  deliveryBreakdown,
  deliveryShopNames,
  onLoadShippingData,
  onConfirmCheckout,
  loading,
  cardBg,
  borderColor,
  mutedText
}: any) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
    <ModalOverlay bg="blackAlpha.600" />
    <ModalContent bg={cardBg} mx={4}>
      <ModalHeader 
        borderBottom="1px solid" 
        borderColor={borderColor}
        fontWeight="400"
        fontSize="xl"
        letterSpacing="0.5px"
        textTransform="uppercase"
      >
        Informations de livraison
      </ModalHeader>
      <ModalCloseButton top={4} right={4} />
      <ModalBody py={8}>
        <VStack spacing={6}>
          <FormControl isRequired>
            <FormLabel 
              fontSize="xs" 
              textTransform="uppercase" 
              letterSpacing="1px"
              color={mutedText}
              fontWeight="400"
              mb={2}
            >
              Nom complet
            </FormLabel>
            <Input 
              value={buyerName} 
              onChange={(e) => setBuyerName(e.target.value)} 
              placeholder="Votre nom" 
              size="lg"
              borderColor={borderColor}
              _focus={{ borderColor: 'black' }}
              _placeholder={{ color: mutedText }}
              fontWeight="300"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel 
              fontSize="xs" 
              textTransform="uppercase" 
              letterSpacing="1px"
              color={mutedText}
              fontWeight="400"
              mb={2}
            >
              Téléphone
            </FormLabel>
            <Input 
              value={buyerPhone} 
              onChange={(e) => setBuyerPhone(e.target.value)} 
              placeholder="Votre numéro" 
              size="lg"
              borderColor={borderColor}
              _focus={{ borderColor: 'black' }}
              _placeholder={{ color: mutedText }}
              fontWeight="300"
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel 
              fontSize="xs" 
              textTransform="uppercase" 
              letterSpacing="1px"
              color={mutedText}
              fontWeight="400"
              mb={2}
            >
              Adresse de livraison
            </FormLabel>
            <Textarea 
              value={buyerAddress} 
              onChange={(e) => {
                setBuyerAddress(e.target.value)
                onLoadShippingData(e.target.value, shippingType)
              }} 
              placeholder="Votre adresse complète" 
              rows={3}
              size="lg"
              borderColor={borderColor}
              _focus={{ borderColor: 'black' }}
              _placeholder={{ color: mutedText }}
              fontWeight="300"
            />
          </FormControl>

          {/* Sélection de livraison */}
          <VStack spacing={3} align="stretch">
            <FormControl>
              <FormLabel fontSize="xs" textTransform="uppercase" letterSpacing="1px" color={mutedText} fontWeight="400" mb={2}>
                Type de livraison
              </FormLabel>
              <RadioGroup 
                onChange={(v) => { 
                  setShippingType(v as any)
                  onLoadShippingData(buyerAddress, v as any) 
                }} 
                value={shippingType}
              >
                <HStack spacing={3}>
                  <Radio value="auto">Auto</Radio>
                  <Radio value="local">Dakar (local)</Radio>
                  <Radio value="regional">Hors Dakar</Radio>
                  <Radio value="express">Express</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <Box>
              <Text fontSize="sm" color={mutedText} mb={2} textTransform="uppercase">
                Frais par boutique
              </Text>
              <List spacing={2}>
                {Object.keys(deliveryBreakdown).length === 0 && (
                  <ListItem fontSize="sm" color={mutedText}>
                    Aucun frais calculé
                  </ListItem>
                )}
                    {Object.entries(deliveryBreakdown).map(([owner, amount]) => (
                      <ListItem key={owner} fontSize="sm" display="flex" justifyContent="space-between">
                        <Text>{deliveryShopNames[owner] ?? `Vendeur`}</Text>
                        <Text>{Math.floor(Number(amount || 0))} FCFA</Text>
                      </ListItem>
                    ))}
              </List>
            </Box>
          </VStack>
        </VStack>
      </ModalBody>
      
      <ModalFooter borderTop="1px solid" borderColor={borderColor} gap={3}>
        <Button 
          flex={1}
          variant="outline"
          onClick={onClose}
          size="lg"
          h="56px"
          borderColor={borderColor}
          fontWeight="400"
          letterSpacing="1px"
          textTransform="uppercase"
          fontSize="sm"
        >
          Annuler
        </Button>
        <Button 
          flex={1}
          bg="black"
          color="white"
          _hover={{ bg: 'gray.800' }}
          onClick={onConfirmCheckout} 
          isLoading={loading}
          size="lg"
          h="56px"
          fontWeight="400"
          letterSpacing="1px"
          textTransform="uppercase"
          fontSize="sm"
        >
          Confirmer
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)