import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Button, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, HStack, Image, useToast, IconButton, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormControl, FormLabel, Input, Textarea, useDisclosure, VStack, Divider, Flex } from '@chakra-ui/react'
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

  useEffect(() => {
    setItems(cart.list())
    function onChange() { setItems(cart.list()) }
    if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('cart:changed', onChange)
      return () => globalThis.removeEventListener('cart:changed', onChange)
    }
    return () => {}
  }, [])

  function setQty(id: string, q: number) { cart.updateQuantity(id, q); setItems(cart.list()) }
  function remove(id: string) { cart.remove(id); setItems(cart.list()) }

  async function checkout() {
    if (items.length === 0) return toast({ title: 'Votre panier est vide', status: 'info', duration: 2000 })
    // Pré-remplir le nom et le téléphone si l'utilisateur est connecté
    try {
      const u = getItem('user') ? JSON.parse(getItem('user') as string) : null
      if (u) {
        // user peut contenir display_name, name, full_name, phone
        setBuyerName(u.display_name ?? u.name ?? u.full_name ?? '')
        setBuyerPhone(u.phone ?? u.phone_number ?? '')
      }
    } catch (e) {
      // ignore parse errors
    }

    onOpenCheckout()
  }

  async function confirmCheckout() {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      return toast({ title: 'Informations requises', description: 'Veuillez compléter tous les champs obligatoires', status: 'warning', duration: 3000 })
    }
    setLoading(true)
    try {
      const token = getItem('token') ?? undefined
      const user = getItem('user') ? JSON.parse(getItem('user') as string) : null
      const buyer_id = user ? user.id : null

      const promises = items.map((it) => {
        const payload: any = {
          product_id: it.id,
          product_title: it.title,
          price: it.price,
          payment_method: 'cash_on_delivery',
          buyer_name: buyerName || null,
          buyer_phone: buyerPhone || null,
          address: buyerAddress || null,
          product_image: it.image || null,
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
    } finally { setLoading(false) }
  }

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const mutedText = useColorModeValue('gray.600', 'gray.400')

  return (
    <Container maxW="1200px" py={10} pb={{ base: '140px', md: 10 }}>
      <VStack spacing={8} align="stretch">
        {/* Header minimaliste */}
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
          <Box 
            py={20}
            textAlign="center"
          >
            <Text 
              fontSize="lg" 
              color={mutedText}
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
              onClick={() => nav('/')}
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
        ) : (
          <Flex 
            direction={{ base: 'column', lg: 'row' }}
            gap={8}
            align="flex-start"
          >
            {/* Liste des articles */}
            <VStack flex="1" spacing={0} align="stretch">
              {items.map((it, idx) => (
                <Box 
                  key={it.id}
                  borderBottom="1px solid"
                  borderColor={borderColor}
                  py={6}
                >
                  <Flex gap={6} align="flex-start">
                    <Box
                      position="relative"
                      flexShrink={0}
                    >
                      <Image 
                        src={it.image ?? undefined} 
                        w={{ base: '100px', md: '140px' }}
                        h={{ base: '130px', md: '180px' }}
                        objectFit="cover" 
                        alt={it.title}
                      />
                    </Box>
                    
                    <VStack flex="1" align="stretch" spacing={3}>
                      <Flex justify="space-between" align="flex-start">
                        <Box flex="1">
                          <Text 
                            fontWeight="400" 
                            fontSize="md" 
                            color={useColorModeValue('black', 'white')}
                            letterSpacing="0.3px"
                            mb={1}
                          >
                            {it.title}
                          </Text>
                          <Text 
                            fontSize="md" 
                            color={useColorModeValue('black', 'white')}
                            fontWeight="400"
                            mt={2}
                          >
                            {Math.floor(it.price ?? 0)} FCFA
                          </Text>
                        </Box>
                        
                        <IconButton 
                          aria-label="Supprimer" 
                          icon={<CloseIcon boxSize={3} />}
                          size="sm"
                          variant="ghost"
                          color={mutedText}
                          onClick={() => remove(it.id)}
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
                            value={String(it.quantity)} 
                            min={1}
                            onChange={(_, v) => setQty(it.id, Number(v))}
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
              ))}
            </VStack>

            {/* Résumé sticky */}
            <Box 
              w={{ base: 'full', lg: '380px' }}
              position={{ base: 'relative', lg: 'sticky' }}
              top={{ lg: '20px' }}
              flexShrink={0}
            >
              <Box 
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                p={6}
              >
                <VStack spacing={5} align="stretch">
                  <Text 
                    fontSize="lg" 
                    fontWeight="400"
                    textTransform="uppercase"
                    letterSpacing="1px"
                  >
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
                      À déterminer
                    </Text>
                  </Flex>

                  <Divider borderColor={borderColor} />

                  <Flex justify="space-between" align="center" py={2}>
                    <Text 
                      fontSize="md" 
                      fontWeight="400"
                      textTransform="uppercase"
                      letterSpacing="1px"
                    >
                      Total
                    </Text>
                    <Text 
                      fontSize="xl" 
                      fontWeight="400"
                    >
                      {Math.floor(cart.getTotal())} FCFA
                    </Text>
                  </Flex>

                  <Button
                    w="full"
                    size="lg"
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    onClick={checkout}
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
                    color={useColorModeValue('black', 'white')}
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                    onClick={() => nav(-1)}
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
                    onClick={() => { cart.clear(); setItems([]); }}
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
          </Flex>
        )}
      </VStack>

      {/* Modal minimaliste */}
      <Modal isOpen={isCheckoutOpen} onClose={onCloseCheckout} isCentered size="xl">
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
                  onChange={(e) => setBuyerAddress(e.target.value)} 
                  placeholder="Votre adresse complète" 
                  rows={3}
                  size="lg"
                  borderColor={borderColor}
                  _focus={{ borderColor: 'black' }}
                  _placeholder={{ color: mutedText }}
                  fontWeight="300"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={borderColor} gap={3}>
            <Button 
              flex={1}
              variant="outline"
              onClick={onCloseCheckout}
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
              onClick={confirmCheckout} 
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
    </Container>
  )
}