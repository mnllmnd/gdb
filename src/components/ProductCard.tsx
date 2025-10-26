import React, { useState } from 'react'
import { 
  Box, Image, Heading, Text, Stack, Button, useToast, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, 
  FormControl, FormLabel, Input, Textarea, useDisclosure, useBreakpointValue, 
  Link as ChakraLink, Badge, HStack, VStack, Icon, Flex, ScaleFade, Fade,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaStore, FaShoppingCart, FaEye, FaHeart, FaRegHeart } from 'react-icons/fa'
import cart from '../utils/cart'
import { getItem } from '../utils/localAuth'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import { FaCartShopping } from 'react-icons/fa6'

export default function ProductCard({
  id,
  title,
  price,
  image,
  image_url,
  shopName = null,
  shopDomain = null,
  height = { base: '140px', md: '200px' },
}: Readonly<{
  id: string
  title?: string
  price: number | string | null | undefined
  image?: string
  image_url?: string
  shopName?: string | null
  shopDomain?: string | null
  height?: any
}>) {
  const [isHovered, setIsHovered] = useState(false)
  const toast = useToast()
  
  // Colors for light/dark mode
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400')
  const priceBg = useColorModeValue('green.50', 'green.900')
  const priceText = useColorModeValue('green.800', 'green.200')
  const shopBadgeBg = useColorModeValue('brand.50', 'brand.900')
  const shopBadgeText = useColorModeValue('brand.700', 'brand.200')

  // compute numeric price and display text safely
  const numericPrice = (() => {
    if (typeof price === 'number') return price
    if (typeof price === 'string' && price.trim() !== '') {
      const n = Number(price)
      return Number.isFinite(n) ? n : null
    }
    return null
  })()

  // Format price: remove decimals and show thousands separators using French locale
  const formattedPrice = (() => {
    if (numericPrice == null) return null
    const whole = Math.floor(numericPrice)
    try {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(whole)
    } catch (e) {
      return String(whole)
    }
  })()

  const [hasImage, setHasImage] = useState<boolean | null>(null)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [likesCount, setLikesCount] = useState<number | null>(null)
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure()
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl' })

  // Resolve the final src we will use
  const chosen = image_url ?? image
  const resolvedSrc = (highRes(chosen, { width: 1000, quality: 80 }) ?? chosen) as string | undefined
  
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

  // Load like state for this product (if user is logged in we also get whether current user liked it)
  React.useEffect(() => {
    let mounted = true
    const token = globalThis.localStorage?.getItem('token') ?? undefined
    const load = async () => {
      try {
        const res = await api.products.getLikes(id, token)
        if (!mounted) return
        setLikesCount(typeof res.count === 'number' ? res.count : Number(res.count || 0))
        setLiked(Boolean(res.liked))
      } catch (err) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  function addToCart() {
    try {
      const numeric = numericPrice
      cart.add({ id, title: title || 'Sans titre', price: numeric, image: chosen ?? null }, 1)
      toast({ 
        title: 'Ajouté au panier 🛒', 
        status: 'success', 
        duration: 2000,
        position: 'top-right'
      })
    } catch (err) {
      console.error(err)
      toast({ 
        title: 'Erreur', 
        description: "Impossible d'ajouter au panier", 
        status: 'error',
        duration: 3000,
        position: 'top-right'
      })
    }
  }

  return (
    <ScaleFade in={true} initialScale={0.95}>
      <Box
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg={cardBg}
        boxShadow="sm"
        transition="all 0.3s ease"
        _hover={{ 
          transform: 'translateY(-8px)',
          boxShadow: 'xl',
          borderColor: 'brand.300'
        }}
        position="relative"
        borderColor={borderColor}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        {/* Image Section */}
        <Box 
          position="relative" 
          height={height} 
          bg="gray.50" 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          overflow="hidden"
          cursor="pointer"
          onClick={onImageOpen}
        >
          <Image
            src={resolvedSrc ?? PRODUCT_PLACEHOLDER}
            alt={title}
            objectFit="cover"
            objectPosition="center center"
            width="100%"
            height="100%"
            transition="transform 0.3s ease"
            _hover={{ transform: 'scale(1.05)' }}
            onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
          />
          
          {/* Hover Overlay */}
          <Fade in={isHovered}>
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="blackAlpha.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Badge colorScheme="whiteAlpha" bg="blackAlpha.600" color="white" px={3} py={2}>
                <HStack spacing={1}>
                  <Icon as={FaEye} />
                  <Text>Voir</Text>
                </HStack>
              </Badge>
            </Box>
          </Fade>

          {hasImage === false && (
            <Badge 
              position="absolute" 
              bottom="12px" 
              left="12px" 
              colorScheme="orange" 
              px={2} 
              py={1} 
              borderRadius="md" 
              fontSize="xs"
            >
              Pas d'image
            </Badge>
          )}

          {/* Price Badge - Removed from image section */}
        </Box>

        {/* Content Section */}
        <Box p={4} flex="1" display="flex" flexDirection="column">
          <VStack spacing={3} align="stretch" flex="1">
            {/* Product Title */}
            <Heading 
              size="sm" 
              color={textColor} 
              fontWeight="700" 
              noOfLines={2}
              lineHeight="1.4"
              minH="2.8rem"
            >
              {title || 'Sans titre'}
            </Heading>

            {/* Price Display - Moved between title and shop */}
            {formattedPrice && (
              <Flex align="center" justify="space-between">
                <Text 
                  fontSize="lg" 
                  fontWeight="800" 
                  color={priceText}
                  bg={priceBg}
                  px={3}
                  py={1}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('green.200', 'green.700')}
                  whiteSpace="nowrap"
                >
                  {formattedPrice} FCFA
                </Text>
              </Flex>
            )}

            {/* Shop Info */}
            {shopName && (
              <HStack spacing={2} mt={1}>
                <Icon as={FaStore} color={shopBadgeText} boxSize={3} />
                {shopDomain ? (
                  <ChakraLink
                    as={RouterLink}
                    to={`/shop/${encodeURIComponent(shopDomain)}`}
                    fontSize="sm"
                    fontWeight="600"
                    color={shopBadgeText}
                    _hover={{ 
                      textDecoration: 'none',
                      color: 'brand.600'
                    }}
                    noOfLines={1}
                  >
                    {shopName}
                  </ChakraLink>
                ) : (
                  <Text fontSize="sm" fontWeight="600" color={shopBadgeText} noOfLines={1}>
                    {shopName}
                  </Text>
                )}
              </HStack>
            )}

            {/* Action Button - Only Add to Cart */}
            <VStack spacing={2} mt="auto">
              <HStack width="100%" spacing={2}>
                <Button 
                  onClick={addToCart}
                  flex="1"
                  borderRadius="lg"
                  size="sm"
                  height="40px"
                  variant="outline"
                  bg="transparent"
               
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    
                   
                  }}
                  _active={{
                    
                  }}
                   
                  colorScheme="teal"
                  transition="all 0.2s ease"
                  
                >
                 🛒 Panier
                </Button>

                <Button
                  aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  onClick={async () => {
                    const token = globalThis.localStorage?.getItem('token') ?? undefined
                    if (!token) {
                      toast({ title: 'Connectez-vous', description: 'Veuillez vous connecter pour ajouter aux favoris.', status: 'info', duration: 2500 })
                      return
                    }
                    try {
                      if (liked) {
                        const res = await api.products.unlike(id, token)
                        setLiked(false)
                        if (res && typeof res.count === 'number') setLikesCount(res.count)
                      } else {
                        const res = await api.products.like(id, token)
                        setLiked(true)
                        if (res && typeof res.count === 'number') setLikesCount(res.count)
                      }
                    } catch (err) {
                      console.error('Like action failed', err)
                      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les favoris', status: 'error', duration: 2500 })
                    }
                  }}
                  size="sm"
                  height="40px"
                  borderRadius="lg"
                  variant="outline"
                >
                  <HStack spacing={2} align="center">
                    <Icon as={liked ? FaHeart : FaRegHeart} color={liked ? 'red.400' : undefined} />
                    <Text fontSize="sm">{likesCount ?? ''}</Text>
                  </HStack>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Image Lightbox Modal */}
        <Modal isOpen={isImageOpen} onClose={onImageClose} size={modalSize} isCentered>
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="transparent" boxShadow="none" maxW="90vw">
            <ModalCloseButton 
              color="white" 
              bg="blackAlpha.600" 
              _hover={{ bg: 'blackAlpha.800' }}
              size="lg"
              borderRadius="full"
              zIndex={1}
            />
            <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
              <Image 
                src={resolvedSrc ?? PRODUCT_PLACEHOLDER} 
                alt={title} 
                objectFit="contain" 
                maxH="85vh"
                borderRadius="lg"
                onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }} 
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </ScaleFade>
  )
}