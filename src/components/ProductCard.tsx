import React, { useState } from 'react'
import { 
  Box, Image, Heading, Text, Stack, Button, useToast, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, 
  FormControl, FormLabel, Input, Textarea, useDisclosure, useBreakpointValue, 
  Link as ChakraLink, Badge, HStack, VStack, Icon, Flex, ScaleFade, Fade, SimpleGrid,
  useColorModeValue, AspectRatio, IconButton
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { FaStore, FaShoppingCart, FaEye, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import cart from '../utils/cart'
import { getItem } from '../utils/localAuth'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import { FaCartShopping } from 'react-icons/fa6'
import WishlistButton from './WishlistButton'

export default function ProductCard({
  id,
  title,
  description,
  price,
  discount = 0,
  originalPrice,
  image,
  image_url,
  images,
  quantity = null,
  shopName = null,
  shopDomain = null,
  shopId = null,
  height = { base: '280px', md: '320px' },
  isPinterestMode = false,
}: Readonly<{
  id: string
  title?: string
  description?: string
  price: number | string | null | undefined
  discount?: number
  originalPrice?: number | string | null | undefined
  image?: string
  image_url?: string
  images?: string[]
  quantity?: number | null
  shopName?: string | null
  shopDomain?: string | null
  shopId?: string | null
  height?: any
  isPinterestMode?: boolean
}>) {
  const [isHovered, setIsHovered] = useState(false)
  const toast = useToast()
  
  // Couleurs style Zara premium
  const cardBg = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.700')
  const textColor = useColorModeValue('black', 'white')
  const subtleTextColor = useColorModeValue('#666666', 'gray.400')
  const priceText = useColorModeValue('#111111', 'white')
  const accentColor = useColorModeValue('#111111', 'white')
  const hoverShadow = useColorModeValue('0 8px 32px rgba(0,0,0,0.12)', '0 8px 32px rgba(0,0,0,0.4)')
  const buttonBg = useColorModeValue('black', 'white')
  const buttonColor = useColorModeValue('white', 'black')

  const formatPrice = (value: number | string | null | undefined) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  const numericPrice = formatPrice(price)
  const numericOriginalPrice = formatPrice(originalPrice)

  const calculateDiscountedPrice = (base: number, discountPct: number) => {
    return base * (1 - discountPct / 100)
  }

  let resolvedFinalPrice: number | null = null
  if (numericPrice != null && numericOriginalPrice != null) {
    resolvedFinalPrice = numericPrice
  } else if (numericPrice != null && numericOriginalPrice == null) {
    resolvedFinalPrice = numericPrice
  } else if (numericPrice == null && numericOriginalPrice != null) {
    resolvedFinalPrice = discount && typeof discount === 'number'
      ? calculateDiscountedPrice(numericOriginalPrice, discount)
      : numericOriginalPrice
  } else {
    resolvedFinalPrice = null
  }

  let resolvedOriginalPrice: number | null = null
  if (numericOriginalPrice != null) {
    resolvedOriginalPrice = numericOriginalPrice
  } else if (resolvedFinalPrice != null && discount > 0 && discount < 100) {
    resolvedOriginalPrice = Math.round(resolvedFinalPrice / (1 - discount / 100))
  }

  let resolvedDiscountPercent = typeof discount === 'number' ? Math.max(0, Math.min(100, Math.round(discount))) : 0
  if (resolvedOriginalPrice != null && resolvedFinalPrice != null && resolvedOriginalPrice > 0) {
    const implied = Math.round((1 - (resolvedFinalPrice / resolvedOriginalPrice)) * 100)
    if (Math.abs(implied - resolvedDiscountPercent) >= 2) {
      resolvedDiscountPercent = Math.max(0, Math.min(100, implied))
    }
  }

  const formatDisplayPrice = (value: number | null) => {
    if (value == null) return null
    const whole = Math.floor(value)
    try {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(whole)
    } catch (e) {
      return String(whole)
    }
  }

  const formattedOriginalPrice = formatDisplayPrice(resolvedOriginalPrice)
  const formattedPrice = formatDisplayPrice(resolvedFinalPrice)

  const [hasImage, setHasImage] = useState<boolean | null>(null)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [likesCount, setLikesCount] = useState<number | null>(null)
  const [stock, setStock] = useState<number | null>(quantity ?? null)
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure()

  const rawImages = Array.isArray(images) ? images : []
  const cleanedOrdered = rawImages
    .map((u) => (typeof u === 'string' ? u.trim() : String(u)))
    .filter((u) => !!u)
  const seen = new Set()
  const uniqueImages: string[] = []
  for (const u of cleanedOrdered) {
    if (!seen.has(u)) {
      seen.add(u)
      uniqueImages.push(u)
    }
  }
  const finalImages: string[] = uniqueImages.length > 0
    ? uniqueImages
    : (image_url ? [image_url] : (image ? [image] : []))
  const [imageIndex, setImageIndex] = useState<number>(0)
  const [imageLoaded, setImageLoaded] = useState<boolean>(true)

  const nextImage = () => {
    if (!finalImages || finalImages.length <= 1) return
    setImageLoaded(false)
    setImageIndex((i) => (i + 1) % finalImages.length)
  }
  const prevImage = () => {
    if (!finalImages || finalImages.length <= 1) return
    setImageLoaded(false)
    setImageIndex((i) => (i - 1 + finalImages.length) % finalImages.length)
  }
  const touchStartXRef = React.useRef<number | null>(null)
  const touchStartYRef = React.useRef<number | null>(null)

  // Unified touch handlers: detect horizontal swipes for image change and
  // vertical swipe-down (dominant vertical movement) to close the modal.
  const onUnifiedTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null
    touchStartYRef.current = e.touches?.[0]?.clientY ?? null
  }

  const onUnifiedTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    const endX = e.changedTouches?.[0]?.clientX ?? null
    const endY = e.changedTouches?.[0]?.clientY ?? null

    // reset for next interaction
    touchStartXRef.current = null
    touchStartYRef.current = null

    if (startX == null || startY == null || endX == null || endY == null) return

    const dx = endX - startX
    const dy = endY - startY

    // Horizontal swipe -> change image (only if horizontal movement dominates)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx < 0) nextImage()
      else prevImage()
      return
    }

    // Vertical swipe-down (dominant vertical movement) -> close modal
    // Only close on a clear swipe-down gesture to avoid interfering with
    // diagonal swipes used to change images.
    if (dy > 100 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      onDetailClose()
    }
  }

  React.useEffect(() => { setImageIndex(0); setImageLoaded(false) }, [finalImages.length])
  
  React.useEffect(() => {
    if (!finalImages || finalImages.length <= 1) return
    if (isHovered) return
    const t = setInterval(() => {
      setImageIndex((i) => (i + 1) % finalImages.length)
      setImageLoaded(false)
    }, 5000)
    return () => clearInterval(t)
  }, [finalImages.length, isHovered])
  
  const isMobile = useBreakpointValue({ base: true, md: false })
  const modalSize = useBreakpointValue({ 
    base: 'full',
    sm: 'lg',
    md: 'xl',
    lg: '4xl'
  })
  
  const modalMaxHeight = useBreakpointValue({
    base: '100vh',
    md: '90vh'
  })

  const location = useLocation()
  const navigate = useNavigate()

  const handleOpen = (e?: React.MouseEvent) => {
    try {
      const path = location?.pathname || ''
      const shouldNavigate = path === '/' || path.startsWith('/products') || path.startsWith('/shops') || path.startsWith('/shop') || path.startsWith('/search')
      if (shouldNavigate) {
        onDetailOpen()
        return
      }
    } catch (err) {
      // fallback to modal when navigation fails
    }
    onDetailOpen()
  }

  const chosen = finalImages[imageIndex] ?? image_url ?? image
  const resolvedSrc = (highRes(chosen, { width: 1200, quality: 90 }) ?? chosen) as string | undefined
  
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

  React.useEffect(() => {
    const handler = (e: any) => {
      try {
        const d = e?.detail || {}
        if (!d) return
        if (d.productId === id && typeof d.count !== 'undefined') {
          setLikesCount(typeof d.count === 'number' ? d.count : Number(d.count || 0))
        }
      } catch (err) {
        // ignore
      }
    }
    if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('product:likesChanged', handler as any)
    }
    return () => {
      try {
        if (typeof globalThis !== 'undefined' && typeof globalThis.removeEventListener === 'function') {
          globalThis.removeEventListener('product:likesChanged', handler as any)
        }
      } catch (e) { /* ignore */ }
    }
  }, [id])

  React.useEffect(() => { setStock(quantity ?? null) }, [quantity])

  // Gestion de la fermeture par swipe down sur mobile
  // (replaced by unified touch handlers above)

  function addToCart() {
    try {
      if (stock != null && stock <= 0) {
        toast({ 
          title: 'Rupture de stock', 
          description: 'Ce produit est en rupture de stock.', 
          status: 'warning', 
          duration: 2500,
          position: 'top-right'
        })
        return
      }
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
    <>
      <Box
        id={`product-${id}`}
        borderWidth="1px"
        borderRadius="12px"
        overflow="hidden"
        bg={cardBg}
        boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        transition="all 0.3s ease"
        position="relative"
        borderColor={borderColor}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        height="100%"
        display="flex"
        flexDirection="column"
        width="100%"
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: hoverShadow,
        }}
      >
        {/* Image Section */}
        <Box 
          position="relative" 
          cursor="pointer"
          onClick={handleOpen}
          bg={useColorModeValue('#f8f8f8', 'gray.900')}
        >
          <AspectRatio ratio={1} width="100%">
            {finalImages && finalImages.length > 0 ? (
              <Image
                src={(highRes(finalImages[imageIndex], { width: 1200, quality: 90 }) ?? finalImages[imageIndex]) as string}
                alt={title || `product-${id}-${imageIndex}`}
                objectFit="contain"
                objectPosition="center center"
                width="100%"
                height="100%"
                onLoad={() => setImageLoaded(true)}
                onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
              />
            ) : (
              <Image 
                src={PRODUCT_PLACEHOLDER} 
                alt={title} 
                objectFit="contain" 
                width="100%"
                height="100%"
              />
            )}
          </AspectRatio>

          {/* Bouton d'ajout au panier en overlay - Style Zara */}
          <Fade in={isHovered}>
            <Box
              position="absolute"
              top="12px"
              right="12px"
              zIndex={2}
            >
              <IconButton
                aria-label="Ajouter au panier"
                icon={<FaShoppingCart />}
                size="sm"
                borderRadius="8px"
                bg={buttonBg}
                color={buttonColor}
                onClick={(e) => { e.stopPropagation(); addToCart(); }}
                _hover={{
                  bg: useColorModeValue('gray.800', 'gray.200'),
                  transform: 'scale(1.1)'
                }}
                transition="all 0.2s ease"
              />
            </Box>
          </Fade>

          {/* Badges d'état */}
          {finalImages && finalImages.length > 1 && (
            <Badge
              position="absolute"
              top="12px"
              left="12px"
              bg="white"
              color="black"
              px={2}
              py={1}
              borderRadius="6px"
              fontSize="xs"
              fontWeight="600"
              border="1px solid"
              borderColor={borderColor}
            >
              +{finalImages.length}
            </Badge>
          )}

          {stock != null && stock <= 0 && (
            <Badge 
              position="absolute" 
              bottom="12px" 
              left="12px" 
              bg="red.500"
              color="white"
              px={3} 
              py={1} 
              borderRadius="6px" 
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
            >
              Rupture
            </Badge>
          )}

          {resolvedDiscountPercent > 0 && (
            <Badge 
              position="absolute" 
              bottom="12px" 
              right="12px" 
              bg="red.500"
              color="white"
              px={2} 
              py={1} 
              borderRadius="6px" 
              fontSize="xs"
              fontWeight="600"
            >
              -{resolvedDiscountPercent}%
            </Badge>
          )}
        </Box>

        {/* Content Section - Style Zara */}
        <Box p={4} flex="1" display="flex" flexDirection="column">
          <VStack spacing={3} align="stretch" flex="1">
            {/* Shop Name */}
            {shopName && (
              <Text 
                fontSize="xs" 
                fontWeight="500" 
                color={subtleTextColor}
                letterSpacing="0.3px"
              >
                {shopName}
              </Text>
            )}

            {/* Product Title */}
            <Heading 
              size="sm" 
              color={textColor} 
              fontWeight="400" 
              noOfLines={2}
              lineHeight="1.4"
              fontSize={{ base: 'sm', md: 'md' }}
              letterSpacing="-0.2px"
            >
              {title || 'Sans titre'}
            </Heading>

            {/* Price Section */}
            {formattedPrice && (
              <VStack align="flex-start" spacing={1} mt="auto">
                {resolvedDiscountPercent > 0 && formattedOriginalPrice && (
                  <Text
                    fontSize="sm"
                    textDecoration="line-through"
                    color={subtleTextColor}
                    fontWeight="300"
                  >
                    {formattedOriginalPrice} FCFA
                  </Text>
                )}
                <Text 
                  fontSize="lg"
                  fontWeight="500" 
                  color={textColor}
                  letterSpacing="-0.3px"
                >
                  {formattedPrice} FCFA
                </Text>
              </VStack>
            )}

            {/* Action Buttons */}
            <HStack spacing={2} mt={3}>
              <Button 
                onClick={(e) => { e.stopPropagation(); addToCart(); }}
                flex="1"
                borderRadius="8px"
                size="sm"
                height="40px"
                variant="solid"
                bg={cardBg}
                color={buttonColor}
                isDisabled={stock != null && stock <= 0}
                _hover={{
                  bg: useColorModeValue('gray.800', 'gray.200'),
                  transform: 'translateY(-1px)'
                }}
                _active={{
                  transform: 'translateY(0)'
                }}
                fontWeight="500"
                fontSize="sm"
                transition="all 0.2s ease"
              >
                <HStack spacing={2}>
                  <Text>+</Text>
                </HStack>
              </Button>

              <WishlistButton productId={id} />
            </HStack>
          </VStack>
        </Box>
      </Box>

      {/* Modal détaillée */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={onDetailClose} 
        size={modalSize}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent 
          borderRadius="12px"
          maxW={{ base: '100vw', md: '90vw', lg: '1200px' }}
          maxH={modalMaxHeight}
          mx={{ base: 0, md: 0 }}
          my={{ base: 0, md: 0 }}
          bg={cardBg}
        >
          <ModalHeader 
            pb={4} 
            borderBottom="1px solid" 
            borderColor={borderColor}
            position="relative"
            pr="70px"
          >
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="500" noOfLines={2} color={textColor}>
                {title}
              </Text>
              {shopName && (
                <Text fontSize="sm" color={subtleTextColor} fontWeight="400">
                  {shopName}
                </Text>
              )}
            </VStack>
          </ModalHeader>
          
          <ModalCloseButton 
            size="lg"
            position="absolute"
            top={4}
            right={4}
            bg="blackAlpha.700"
            color="white"
            _hover={{ bg: 'blackAlpha.800' }}
            borderRadius="8px"
            width="40px"
            height="40px"
            fontSize="16px"
            zIndex={10}
          />
          
          <ModalBody 
            pb={6} 
            px={0}
            onTouchStart={isMobile ? onUnifiedTouchStart : undefined}
            onTouchEnd={isMobile ? onUnifiedTouchEnd : undefined}
          >
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={0}>
              {/* Image Gallery */}
              <Box 
                position="relative" 
                height={{ base: '300px', md: '500px', lg: '600px' }}
                bg={useColorModeValue('#f8f8f8', 'gray.900')}
              >
                <Box 
                  width="100%" 
                  height="100%"
                  position="relative"
                >
                  <Image 
                    src={resolvedSrc ?? PRODUCT_PLACEHOLDER} 
                    alt={title} 
                    objectFit="contain"
                    width="100%"
                    height="100%"
                    opacity={imageLoaded ? 1 : 0}
                    transition="opacity 300ms ease"
                    onLoad={() => setImageLoaded(true)}
                    onError={(e:any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
                  />

                  {finalImages && finalImages.length > 1 && (
                    <>
                      <IconButton
                        aria-label="Image précédente"
                        icon={<FaChevronLeft />}
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        bg="blackAlpha.600"
                        color="white"
                        borderRadius="8px"
                        _hover={{ bg: 'blackAlpha.800' }}
                        onClick={(e) => { e.stopPropagation(); prevImage() }}
                        size="sm"
                      />
                      <IconButton
                        aria-label="Image suivante"
                        icon={<FaChevronRight />}
                        position="absolute"
                        right={4}
                        top="50%"
                        transform="translateY(-50%)"
                        bg="blackAlpha.600"
                        color="white"
                        borderRadius="8px"
                        _hover={{ bg: 'blackAlpha.800' }}
                        onClick={(e) => { e.stopPropagation(); nextImage() }}
                        size="sm"
                      />
                    </>
                  )}

                  {finalImages && finalImages.length > 1 && (
                    <Badge 
                      position="absolute" 
                      bottom={4} 
                      right={4} 
                      bg="blackAlpha.800" 
                      color="white" 
                      px={3} 
                      py={2} 
                      borderRadius="8px" 
                      fontSize="sm"
                      fontWeight="600"
                    >
                      {imageIndex + 1} / {finalImages.length}
                    </Badge>
                  )}
                </Box>

                {finalImages && finalImages.length > 1 && (
                  <Flex 
                    position="absolute" 
                    bottom={0} 
                    left={0} 
                    right={0} 
                    bg="white" 
                    p={3} 
                    borderTop="1px solid" 
                    borderColor={borderColor}
                    overflowX="auto"
                  >
                    <HStack spacing={2}>
                      {finalImages.map((src, idx) => (
                        <Box 
                          key={idx} 
                          border={idx === imageIndex ? '2px solid' : '1px solid'} 
                          borderColor={idx === imageIndex ? accentColor : borderColor} 
                          borderRadius="8px" 
                          overflow="hidden" 
                          cursor="pointer" 
                          onClick={(e) => { e.stopPropagation(); setImageLoaded(false); setImageIndex(idx) }}
                          flexShrink={0}
                          width="60px"
                          height="60px"
                        >
                          <Image 
                            src={highRes(src, { width: 120 }) ?? src} 
                            alt={`Vignette ${idx+1}`} 
                            objectFit="cover" 
                            width="100%" 
                            height="100%" 
                          />
                        </Box>
                      ))}
                    </HStack>
                  </Flex>
                )}
              </Box>

              {/* Product Info */}
              <Box p={{ base: 4, md: 8 }}>
                <VStack spacing={6} align="stretch" height="100%">
                  <VStack spacing={3} align="start">
                    <Text fontSize="2xl" fontWeight="500" color={textColor}>
                      {formattedPrice ? (
                        <VStack align="start" spacing={1}>
                          {resolvedDiscountPercent > 0 && formattedOriginalPrice && (
                            <Text
                              fontSize="lg"
                              textDecoration="line-through"
                              color={subtleTextColor}
                              fontWeight="300"
                            >
                              {formattedOriginalPrice} FCFA
                            </Text>
                          )}
                          <HStack spacing={2} align="baseline">
                            <Text
                              fontSize="2xl"
                              fontWeight="500"
                              color={textColor}
                            >
                              {formattedPrice} FCFA
                            </Text>
                            {resolvedDiscountPercent > 0 && (
                              <Badge 
                                bg="red.500" 
                                color="white" 
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="6px"
                              >
                                -{resolvedDiscountPercent}%
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      ) : 'Prix indisponible'}
                    </Text>
                    
                    {stock != null && (
                      <Badge 
                        bg={stock > 0 ? 'green.500' : 'red.500'}
                        color="white"
                        fontSize="sm" 
                        px={3} 
                        py={1}
                        borderRadius="6px"
                        fontWeight="500"
                      >
                        {stock > 0 ? `En stock (${stock})` : 'Rupture de stock'}
                      </Badge>
                    )}
                  </VStack>

                  {description && (
                    <Box>
                      <Text fontWeight="500" mb={3} color={textColor} fontSize="lg">
                        Description
                      </Text>
                      <Text color={subtleTextColor} lineHeight="1.6" fontSize="md">
                        {description}
                      </Text>
                    </Box>
                  )}

                  <VStack spacing={3} mt="auto">
                    <Button 
                      onClick={() => { addToCart(); onDetailClose(); }}
                      color={buttonColor}
                      bg={buttonBg}
                      size="lg"
                      height="56px"
                      borderRadius="8px"
                      width="100%"
                      isDisabled={stock != null && stock <= 0}
                      fontWeight="500"
                      fontSize="md"
                      _hover={{
                        bg: useColorModeValue('gray.800', 'gray.200'),
                        transform: 'translateY(-1px)'
                      }}
                      _active={{
                        transform: 'translateY(0)'
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack spacing={3}>
                        <Icon as={FaCartShopping} boxSize={5} />
                        <Text>Ajouter au panier</Text>
                      </HStack>
                    </Button>
                  </VStack>
                </VStack>
              </Box>
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}