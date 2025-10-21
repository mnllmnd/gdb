import React, { useState } from 'react'
import {
  Box,
  Image,
  Heading,
  Text,
  Stack,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  Badge,
  HStack,
  IconButton,
} from '@chakra-ui/react'
import { FiShoppingCart, FiHeart } from 'react-icons/fi'
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
  const [isHovered, setIsHovered] = useState(false)

  // compute numeric price and display text safely
  const numericPrice = (() => {
    if (typeof price === 'number') return price
    if (typeof price === 'string' && price.trim() !== '') {
      const n = Number(price)
      return Number.isFinite(n) ? n : null
    }
    return null
  })()

  const priceDisplayText = numericPrice == null ? '—' : `${Math.floor(numericPrice)} FCFA`
  const [hasImage, setHasImage] = useState<boolean | null>(null)

  const resolvedSrc = (highRes(image, { width: 1000, quality: 80 }) ?? image) as string | undefined
  
  React.useEffect(() => {
    let mounted = true
    if (!resolvedSrc) {
      setHasImage(false)
      return () => { mounted = false }
    }
    if (typeof document === 'undefined') {
      setHasImage(null)
      return () => { mounted = false }
    }
    const probe = document.createElement('img')
    probe.onload = () => { if (mounted) setHasImage(true) }
    probe.onerror = () => { if (mounted) setHasImage(false) }
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
      cart.add({ id, title, price: numericPrice, image: image ?? null }, 1)
      toast({
        title: 'Ajouté au panier',
        status: 'success',
        duration: 2000,
        position: 'top-right',
        isClosable: true,
      })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: "Impossible d'ajouter au panier", status: 'error' })
    }
  }

  return (
    <Box
      position="relative"
      borderRadius="xl"
      overflow="hidden"
      bg="white"
      transition="all 0.3s"
      transform={isHovered ? 'translateY(-4px)' : 'none'}
      boxShadow={isHovered ? 'lg' : 'sm'}
      _hover={{ cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      height={height}
    >
      <Box position="relative" overflow="hidden" pb="100%">
        <Image
          src={hasImage === false ? PRODUCT_PLACEHOLDER : resolvedSrc}
          alt={title}
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          objectFit="cover"
          transition="transform 0.3s ease"
          transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
        />
        <Box
          position="absolute"
          top="0"
          right="0"
          p="2"
          display="flex"
          gap="2"
        >
          <IconButton
            aria-label="Ajouter au panier"
            icon={<FiShoppingCart />}
            size="sm"
            colorScheme="brand"
            variant="solid"
            onClick={(e) => {
              e.stopPropagation()
              addToCart()
            }}
            opacity={isHovered ? 1 : 0}
            transform={isHovered ? 'translateY(0)' : 'translateY(-10px)'}
            transition="all 0.3s"
          />
        </Box>
      </Box>

      <Box p="4">
        <Stack spacing="2">
          <Heading size="md" noOfLines={2}>
            {title}
          </Heading>
          <HStack justify="space-between" align="center">
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="brand.500"
            >
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
                  {priceDisplayText}
                </Text>
              </Box>
            </Text>
            <Badge colorScheme="brand" fontSize="sm" px="2">
              En stock
            </Badge>
          </HStack>
          <Button
            width="full"
            colorScheme="brand"
            variant="outline"
            onClick={onOpen}
            mt="2"
          >
            Commander
          </Button>
        </Stack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Commander {title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Nom</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Adresse de livraison</FormLabel>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
              </FormControl>
              <Box 
                bg="green.50" 
                display="inline-block" 
                px={3} 
                py={2} 
                borderRadius="md"
                mb={3}
              >
                <Text 
                  fontSize="lg" 
                  color="green.700" 
                  fontWeight="bold"
                >
                  Prix: {priceDisplayText}
                </Text>
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={placeOrder}>
              Confirmer la commande
            </Button>
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}