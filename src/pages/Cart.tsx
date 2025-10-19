import React, { useEffect, useState } from 'react'
import { Container, Heading, Stack, Box, Text, Button, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, HStack, Image, useToast } from '@chakra-ui/react'
import cart from '../utils/cart'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function CartPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const nav = useNavigate()

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
    setLoading(true)
    try {
      const payload = {
        items: items.map((it) => ({ product_id: it.id, title: it.title, quantity: it.quantity, price: it.price })),
        total: cart.getTotal(),
        payment_method: 'cash_on_delivery'
      }
      await api.orders.create(payload)
      toast({ title: 'Commande passée', status: 'success', duration: 3000 })
      cart.clear()
      nav('/orders')
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de passer la commande', status: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <Container maxW="container.md" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <Heading mb={4}>Mon panier</Heading>
      {items.length === 0 ? (
        <Text>Votre panier est vide.</Text>
      ) : (
        <Stack spacing={4}>
          {items.map((it) => (
            <Box key={it.id} borderWidth="1px" borderRadius="md" p={3} display="flex" alignItems="center">
              <Image src={it.image ?? undefined} boxSize="80px" objectFit="cover" mr={3} alt={it.title} />
              <Box flex="1">
                <Text fontWeight="600">{it.title}</Text>
                <Text color="gray.600">{it.price ?? 0} CFA</Text>
              </Box>
              <HStack>
                <NumberInput size="sm" maxW="100px" value={String(it.quantity)} min={1} onChange={(_, v) => setQty(it.id, Number(v))}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(it.id)}>Supprimer</Button>
              </HStack>
            </Box>
          ))}

          <Box textAlign="right">
            <Text fontWeight="bold" mb={2}>Total: {cart.getTotal()} CFA</Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} justify="flex-end">
              <Button variant="outline" onClick={() => { cart.clear(); setItems([]); }} isDisabled={items.length === 0}>Vider le panier</Button>
              <Button onClick={() => { if (typeof globalThis !== 'undefined' && globalThis.history) globalThis.history.back() }}>Continuer mes achats</Button>
              <Button colorScheme="brand" onClick={checkout} isLoading={loading}>Passer la commande</Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </Container>
  )
}
