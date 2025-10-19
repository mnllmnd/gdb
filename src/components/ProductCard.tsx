import React, { useState } from 'react'
import { Box, Image, Heading, Text, Stack, Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormControl, FormLabel, Input, Textarea, useDisclosure } from '@chakra-ui/react'
import cart from '../utils/cart'
import { getItem } from '../utils/localAuth'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'

export default function ProductCard({
  id,
  title,
  price,
  image,
}: Readonly<{
  id: string
  title: string
  price: number | string | null | undefined
  image?: string
}>) {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // compute numeric price and display text safely
  const numericPrice = (() => {
    if (typeof price === 'number') return price
    if (typeof price === 'string' && price.trim() !== '') {
      const n = Number(price)
      return Number.isFinite(n) ? n : null
    }
    return null
  })()

  const priceDisplayText = numericPrice == null ? '—' : `${numericPrice.toFixed(2)} CFA`

  async function placeOrder() {
    try {
      const payload = {
        product_id: id,
        product_title: title,
        price: numericPrice,
        buyer_id: getItem('user') ? JSON.parse(getItem('user') as string).id : null,
        payment_method: 'cash_on_delivery',
        buyer_name: name || null,
        buyer_phone: phone || null,
        address: address || null,
        product_image: image || null,
      }
      const token = getItem('token') ?? undefined
      await api.orders.create(payload, token)
      toast({ title: 'Commande créée', status: 'success', duration: 3000 })
      onClose()
      setName('')
      setPhone('')
      setAddress('')
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de créer la commande', status: 'error' })
    }
  }

  function addToCart() {
    try {
      const numeric = numericPrice
      cart.add({ id, title, price: numeric, image: image ?? null }, 1)
      toast({ title: 'Ajouté au panier', status: 'success', duration: 2000 })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: "Impossible d'ajouter au panier", status: 'error' })
    }
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="var(--card-radius)"
      overflow="hidden"
      bg="white"
      boxShadow="var(--card-shadow)"
      transition="all 160ms ease"
      _hover={{ transform: 'translateY(-6px)', boxShadow: 'lg' }}
    >
      <Box height={{ base: '220px', md: '260px' }} bg="gray.50" display="flex" alignItems="center" justifyContent="center" overflow="hidden">
        <Image
          src={highRes(image, { width: 1000, quality: 80 }) ?? PRODUCT_PLACEHOLDER}
          alt={title}
          objectFit="cover"
          width="100%"
          height="100%"
          onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
        />
      </Box>
      <Box p={4}>
        <Stack spacing={3}>
          <Heading size="sm" color="black" fontWeight="600" noOfLines={2}>{title}</Heading>
          <Text color="gray.600" fontWeight="semibold">{priceDisplayText}</Text>
          <Box>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
              <Button colorScheme="brand" onClick={onOpen} width={{ base: '100%', md: 'auto' }} borderRadius="lg" boxShadow="sm">
                Commander
              </Button>
              <Button variant="ghost" onClick={addToCart} width={{ base: '100%', md: 'auto' }} borderRadius="lg">Ajouter au panier</Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Finaliser la commande</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Nom complet</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du client" />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Téléphone</FormLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numéro de téléphone" />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Adresse / Lieu de livraison</FormLabel>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: quartier, rue, point de repère" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="brand" onClick={placeOrder}>Confirmer la commande</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
