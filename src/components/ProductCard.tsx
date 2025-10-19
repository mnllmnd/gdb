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
  height,
}: Readonly<{
  id: string
  title: string
  price: number | string | null | undefined
  image?: string
  height?: any
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
  const [hasImage, setHasImage] = useState<boolean | null>(null)

  // Resolve the final src we will use and probe it to confirm it loads
  const resolvedSrc = (highRes(image, { width: 1000, quality: 80 }) ?? image) as string | undefined
  React.useEffect(() => {
    let mounted = true
    // if there's no resolved src, mark as no image
    if (!resolvedSrc) {
      setHasImage(false)
      return () => { mounted = false }
    }
    if (typeof document === 'undefined') {
      // can't probe in non-browser environment — assume image will be handled by <img>
      setHasImage(null)
      return () => { mounted = false }
    }
    const probe = document.createElement('img')
    probe.onload = () => { if (mounted) setHasImage(true) }
    probe.onerror = () => { if (mounted) setHasImage(false) }
    // start loading
    probe.src = resolvedSrc
    return () => { mounted = false; probe.onload = null; probe.onerror = null }
  }, [resolvedSrc])

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
      <Box position="relative" height={height ?? { base: '110px', md: '220px' }} bg="gray.50" display="flex" alignItems="center" justifyContent="center" overflow="hidden">
        <Image
          src={resolvedSrc ?? PRODUCT_PLACEHOLDER}
          alt={title}
          objectFit="cover"
          objectPosition="center center"
          width="100%"
          height="100%"
          onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
        />
        {hasImage === false && (
          <Box position="absolute" bottom="8px" left="8px" bg="blackAlpha.600" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
            Pas d'image
          </Box>
        )}
      </Box>
  <Box p={{ base: 2, md: 4 }}>
        <Stack spacing={3}>
          <Heading size="sm" color="black" fontWeight="600" noOfLines={2}>{title}</Heading>
          <Text color="gray.600" fontWeight="semibold">{priceDisplayText}</Text>
          <Box>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
              <Button colorScheme="brand" onClick={onOpen} width={{ base: '100%', md: 'auto' }} borderRadius="md" boxShadow="sm" size={{ base: 'sm', md: 'md' }} px={{ base: 3, md: 4 }}>
                Commander
              </Button>
              <Button variant="ghost" onClick={addToCart} width={{ base: '100%', md: 'auto' }} borderRadius="md" size={{ base: 'sm', md: 'md' }} px={{ base: 3, md: 4 }}>Ajouter au panier</Button>
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
