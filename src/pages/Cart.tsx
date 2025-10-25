import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Button, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, HStack, Image, useToast, IconButton, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormControl, FormLabel, Input, Textarea, useDisclosure } from '@chakra-ui/react'
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
    if (items.length === 0) return toast({ title: 'Panier vide', status: 'warning' })
    // Open modal to collect buyer info
    onOpenCheckout()
  }

  async function confirmCheckout() {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      return toast({ title: 'Nom et adresse requis', status: 'warning' })
    }
    setLoading(true)
    try {
      const token = getItem('token') ?? undefined
      const user = getItem('user') ? JSON.parse(getItem('user') as string) : null
      const buyer_id = user ? user.id : null

      // Create one order per cart item so seller receives individual order data
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
      toast({ title: 'Commande(s) passée(s)', status: 'success', duration: 3000 })
      cart.clear()
      setItems([])
      onCloseCheckout()
      nav('/orders')
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de passer la commande', status: 'error' })
    } finally { setLoading(false) }
  }

  const cardBg = useColorModeValue('white', 'gray.700')
  const totalBg = useColorModeValue('gray.50', 'gray.800')

  return (
    <Container maxW="container.md" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <Heading mb={4}>Mon panier</Heading>
      {items.length === 0 ? (
        <Text>Votre panier est vide.</Text>
      ) : (
        <Stack spacing={4}>
          {items.map((it) => (
            <Box key={it.id} borderRadius="var(--card-radius)" boxShadow="var(--card-shadow)" bg={cardBg} p={3} display="flex" alignItems="center">
              <Image src={it.image ?? undefined} boxSize={{ base: '56px', md: '80px' }} objectFit="cover" mr={3} alt={it.title} borderRadius="md" />
              <Box flex="1">
                <Text fontWeight="600">{it.title}</Text>
                <Box 
                  bg="green.50" 
                  display="inline-block" 
                  px={2} 
                  py={1} 
                  borderRadius="md"
                >
                  <Text 
                    fontSize="md" 
                    color="green.700" 
                    fontWeight="bold"
                  >
                    {Math.floor(it.price ?? 0)} FCFA
                  </Text>
                </Box>
              </Box>
              <HStack>
                <NumberInput size="sm" maxW="100px" value={String(it.quantity)} min={1} onChange={(_, v) => setQty(it.id, Number(v))}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <IconButton aria-label={`Supprimer ${it.title}`} icon={<CloseIcon />} size="sm" variant="ghost" colorScheme="red" onClick={() => remove(it.id)} />
              </HStack>
            </Box>
          ))}

          <Box borderRadius="var(--card-radius)" boxShadow="var(--card-shadow)" bg={totalBg} p={4}>
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="lg">Total</Text>
              <Box 
                bg="green.100" 
                display="inline-block" 
                px={3} 
                py={2} 
                borderRadius="lg"
              >
                <Text 
                  fontSize="xl" 
                  color="green.800" 
                  fontWeight="800"
                >
                  {Math.floor(cart.getTotal())} FCFA
                </Text>
              </Box>
            </HStack>
<Stack mt={4} direction={{ base: 'column', sm: 'row' }} spacing={3} justify="flex-end">
  <Button
    variant="outline"
    colorScheme="gray"
    onClick={() => { cart.clear(); setItems([]); }}
    isDisabled={items.length === 0}
  >
    Vider le panier
  </Button>

  <Button
    bg={useColorModeValue('blue.800', 'blue.400')}
    color="white"
    _hover={{ bg: useColorModeValue('blue.600', 'blue.500') }}
    onClick={() => nav(-1)}
  >
    Continuer mes achats
  </Button>

  <Button
    bg={useColorModeValue('green.800', 'green.400')}
    color="white"
    _hover={{ bg: useColorModeValue('green.600', 'green.500') }}
    onClick={checkout}
    isLoading={loading}
  >
    Passer la commande
  </Button>
</Stack>

          </Box>
        </Stack>
      )}

        {/* Modal de checkout pour collecter nom/phone/adresse */}
        <Modal isOpen={isCheckoutOpen} onClose={onCloseCheckout} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Finaliser la commande</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={3} isRequired>
                <FormLabel>Nom complet</FormLabel>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nom du client" />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Téléphone</FormLabel>
                <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="Numéro de téléphone" />
              </FormControl>
              <FormControl mb={3} isRequired>
                <FormLabel>Adresse / Lieu de livraison</FormLabel>
                <Textarea value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Ex: quartier, rue, point de repère" />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseCheckout}>Annuler</Button>
              <Button colorScheme="brand" onClick={confirmCheckout} isLoading={loading}>Confirmer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </Container>
  )
}
