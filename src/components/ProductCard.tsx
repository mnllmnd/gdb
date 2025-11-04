import React, { useState } from 'react'
import { 
  Box, Image, Heading, Text, Stack, Button, useToast, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, 
  FormControl, FormLabel, Input, Textarea, useDisclosure, useBreakpointValue, 
  Link as ChakraLink, Badge, HStack, VStack, Icon, Flex, ScaleFade, Fade, SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { FaStore, FaShoppingCart, FaEye, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import cart from '../utils/cart'
import { getItem } from '../utils/localAuth'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import { FaCartShopping } from 'react-icons/fa6'
import FollowButton from './FollowButton'

export default function ProductCard({
  id,
  title,
  description,
  price,
  image,
  image_url,
  images,
  quantity = null,
  shopName = null,
  shopDomain = null,
  shopId = null,
  height = { base: '130px', md: '160px' },
}: Readonly<{
  id: string
  title?: string
  description?: string
  price: number | string | null | undefined
  image?: string
  image_url?: string
  images?: string[]
  quantity?: number | null
  shopName?: string | null
  shopDomain?: string | null
  shopId?: string | null
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
  const [showHeart, setShowHeart] = useState(false)
  const [likesCount, setLikesCount] = useState<number | null>(null)
  const [stock, setStock] = useState<number | null>(quantity ?? null)
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure()
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure()

  // Gallery support: sanitize incoming images array, remove falsy entries and duplicates
  const rawImages = Array.isArray(images) ? images : []
  const cleanedOrdered = rawImages
    .map((u) => (typeof u === 'string' ? u.trim() : String(u)))
    .filter((u) => !!u)
  // preserve order but remove exact-duplicate URLs
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
  const onTouchStart = (e: React.TouchEvent) => { touchStartXRef.current = e.touches?.[0]?.clientX ?? null }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartXRef.current
    const end = e.changedTouches?.[0]?.clientX ?? null
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) < 30) return
    if (delta < 0) nextImage()
    else prevImage()
  }
  // Reset index when image set changes (safe fallback) and prepare for fade-in
  React.useEffect(() => { setImageIndex(0); setImageLoaded(false) }, [finalImages.length])
  // Auto-advance the gallery every 5 seconds with a fade transition.
  React.useEffect(() => {
    if (!finalImages || finalImages.length <= 1) return
    if (isHovered) return // pause when hovered so user can inspect
    const t = setInterval(() => {
      setImageIndex((i) => (i + 1) % finalImages.length)
      setImageLoaded(false)
    }, 5000)
    return () => clearInterval(t)
  }, [finalImages.length, isHovered])
  
  // ✅ Taille modale adaptative pour mobile
  // Use a smaller modal on mobile so it doesn't take the whole screen.
  const modalSize = useBreakpointValue({ 
    base: 'sm',
    sm: 'sm',
    md: 'xl',
    lg: '2xl'
  })
  
  // ✅ Hauteur max pour mobile (keep some gap from top/bottom)
  const modalMaxHeight = useBreakpointValue({
    base: '80vh',
    md: 'auto'
  })

  const location = useLocation()

  // Resolve the final src we will use (respect gallery index)
  const chosen = finalImages[imageIndex] ?? image_url ?? image
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

  // keep internal stock in sync when prop changes
  React.useEffect(() => { setStock(quantity ?? null) }, [quantity])

  function addToCart() {
    try {
      if (stock != null && stock <= 0) {
        toast({ title: 'Rupture de stock', description: 'Ce produit est en rupture de stock.', status: 'warning', duration: 2500 })
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
        width={{ base: '107%' }}

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
          onClick={onDetailOpen}
          onDoubleClick={async (e) => {
            e.stopPropagation()
            try {
              const token = globalThis.localStorage?.getItem('token') ?? undefined
              if (!token) {
                toast({ title: 'Connectez-vous', description: 'Veuillez vous connecter pour ajouter aux favoris.', status: 'info', duration: 2500 })
                return
              }
              if (liked) {
                setShowHeart(true)
                setTimeout(() => setShowHeart(false), 700)
                return
              }
              const res = await api.products.like(id, token)
              setLiked(true)
              if (res && typeof res.count === 'number') setLikesCount(res.count)
              setShowHeart(true)
              setTimeout(() => setShowHeart(false), 700)
            } catch (err) {
              console.error('Double-tap like failed', err)
            }
          }}
        >
          {/* Fade slideshow: stack all images and fade by opacity */}
          <Box position="relative" width="100%" height="100%">
            {finalImages && finalImages.length > 0 ? (
              finalImages.map((src, idx) => {
                const resolved = (highRes(src, { width: 1000, quality: 80 }) ?? src) as string
                const visible = idx === imageIndex
                return (
                  <Image
                    key={idx}
                    src={resolved}
                    alt={title || `product-${id}-${idx}`}
                    objectFit="cover"
                    objectPosition="center center"
                    width="100%"
                    height="100%"
                    position="absolute"
                    top="0"
                    left="0"
                    transition="opacity 0.8s ease, transform 0.3s ease"
                    opacity={visible ? 1 : 0}
                    transform={visible ? 'scale(1.03)' : 'scale(1)'}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
                    aria-hidden={!visible}
                  />
                )
              })
            ) : (
              <Image
                src={PRODUCT_PLACEHOLDER}
                alt={title}
                objectFit="cover"
                objectPosition="center center"
                width="100%"
                height="100%"
                onError={(e: any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
              />
            )}
          </Box>
          
          {/* Double-tap heart animation */}
          {showHeart && (
            <Box
              position="absolute"
              pointerEvents="none"
              display="flex"
              alignItems="center"
              justifyContent="center"
              top="0"
              left="0"
              right="0"
              bottom="0"
            >
              <ScaleFade initialScale={0.4} in={showHeart}>
                <Box fontSize={{ base: '48px', md: '72px' }} color="white" textShadow="0 2px 10px rgba(0,0,0,0.6)">❤️</Box>
              </ScaleFade>
            </Box>
          )}
          
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

          {/* Photos count badge when multiple images are available */}
          {finalImages && finalImages.length > 1 && (
            <Badge
              position="absolute"
              top="12px"
              right="12px"
              colorScheme="purple"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="xs"
            >
              +{finalImages.length} photos
            </Badge>
          )}

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
        </Box>

        {/* Content Section */}
        <Box p={4} flex="1" display="flex" flexDirection="column">
          <VStack spacing={3} align="stretch" flex="1">
            {/* Product Title */}
            <Heading 
              size="sm" 
              color={textColor} 
              fontWeight="100" 
              noOfLines={2}
              lineHeight="1.4"
              minH="2.8rem"
            >
              {title || 'Sans titre'}
            </Heading>

            {/* Product Description */}
            {description && (
              <Text fontSize="sm" color={subtleTextColor} noOfLines={3}>
                {description}
              </Text>
            )}

            {/* Price Display */}
            {formattedPrice && (
              <Flex align="center" justify="space-between">
                <Text 
                  fontSize="lg" 
                  fontWeight="600" 
                  color={priceText}
                  bg={priceBg}
                  px={3}
                  py={1}
                  borderRadius="lg"
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
                    state={{ from: `${location.pathname}${location.search}${location.hash || ''}` }}
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

            {/* Action Buttons */}
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
                  isDisabled={stock != null && stock <= 0}
                  _hover={{ 
                    transform: 'translateY(-2px)',
                  }}
                  colorScheme="teal"
                  transition="all 0.2s ease"
                >
                 🛒
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

        {/* ✅ Detail Modal - Adapté pour mobile */}
        <Modal 
          isOpen={isDetailOpen} 
          onClose={onDetailClose} 
          size={modalSize}
          isCentered
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent 
            borderRadius={{ base: 'xl', md: '2xl' }}
            maxW={{ base: '95vw', md: '720px' }}
            maxH={modalMaxHeight}
            mx={{ base: 2, md: 0 }}
            my={{ base: 2, md: 0 }}
          >
            <ModalHeader pb={3}>
              <Text fontSize="lg" fontWeight="bold" noOfLines={2}>
                {title}
              </Text>
            </ModalHeader>
            {/* Prominent close control on mobile: fixed so user can always escape */}
            <ModalCloseButton 
              size="lg"
              zIndex={50}
              // fixed position on small screens, normal on larger
              position={{ base: 'fixed', md: 'absolute' }}
              top={{ base: 3, md: undefined }}
              right={{ base: 3, md: undefined }}
              bg={{ base: 'blackAlpha.700', md: 'transparent' }}
              color={{ base: 'white', md: undefined }}
              _hover={{ bg: { base: 'blackAlpha.800', md: undefined } }}
            />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                {/* Image (swipeable gallery) */}
                <Box 
                  width="100%" 
                  height={{ base: '250px', md: '300px' }}
                  borderRadius="lg" 
                  overflow="hidden"
                  bg="gray.50"
                  cursor="pointer"
                  onClick={onImageOpen}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                  position="relative"
                >
                  {/* Prev */}
                  {finalImages && finalImages.length > 1 && (
                    <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={2}>
                      <Box bg="blackAlpha.500" p={1} borderRadius="full" onClick={(e) => { e.stopPropagation(); prevImage() }} cursor="pointer">
                        <Icon as={FaChevronLeft} color="white" boxSize={5} />
                      </Box>
                    </Box>
                  )}

                  <Image 
                    src={resolvedSrc ?? PRODUCT_PLACEHOLDER} 
                    alt={title} 
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    opacity={imageLoaded ? 1 : 0}
                    transition="opacity 300ms ease"
                    onLoad={() => setImageLoaded(true)}
                    onError={(e:any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }}
                  />

                  {/* Next */}
                  {finalImages && finalImages.length > 1 && (
                    <Box position="absolute" right={3} top="50%" transform="translateY(-50%)" zIndex={2}>
                      <Box bg="blackAlpha.500" p={1} borderRadius="full" onClick={(e) => { e.stopPropagation(); nextImage() }} cursor="pointer">
                        <Icon as={FaChevronRight} color="white" boxSize={5} />
                      </Box>
                    </Box>
                  )}

                  {/* Counter */}
                  {finalImages && finalImages.length > 1 && (
                    <Badge position="absolute" bottom={3} right={3} colorScheme="blackAlpha" bg="blackAlpha.600" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
                      {imageIndex + 1} / {finalImages.length}
                    </Badge>
                  )}
                </Box>

                {/* Thumbnails (clickable) */}
                {finalImages && finalImages.length > 1 && (
                  <SimpleGrid columns={{ base: 4, md: 6 }} spacing={2} mt={3}>
                    {finalImages.map((src, idx) => (
                      <Box key={idx} border={idx === imageIndex ? '2px solid' : '1px solid'} borderColor={idx === imageIndex ? 'brand.500' : 'gray.200'} borderRadius="md" overflow="hidden" cursor="pointer" onClick={(e) => { e.stopPropagation(); setImageLoaded(false); setImageIndex(idx) }}>
                        <Image src={highRes(src, { width: 400 }) ?? src} alt={`Vignette ${idx+1}`} objectFit="cover" width="100%" height="60px" />
                      </Box>
                    ))}
                  </SimpleGrid>
                )}

                {/* Price and Stock */}
                <VStack spacing={2} align="start">
                  <Text fontSize="2xl" fontWeight="700" color={priceText}>
                    {formattedPrice ? `${formattedPrice} FCFA` : 'Prix indisponible'}
                  </Text>
                  
                  {stock != null && (
                    <Badge 
                      colorScheme={stock > 0 ? 'green' : 'red'} 
                      fontSize="sm" 
                      px={3} 
                      py={1}
                      borderRadius="md"
                    >
                      {stock > 0 ? `En stock (${stock})` : 'Rupture de stock'}
                    </Badge>
                  )}
                </VStack>

                {/* Description */}
                {description && (
                  <Box>
                    <Text fontWeight="600" mb={2}>Description</Text>
                    <Text color={subtleTextColor} lineHeight="1.6">
                      {description}
                    </Text>
                  </Box>
                )}

                {/* Shop Info */}
                {shopName && (
                  <Box>
                    <Text fontWeight="600" mb={2}>Boutique</Text>
                    <ChakraLink 
                      as={RouterLink} 
                      to={`/shop/${encodeURIComponent(shopDomain ?? '')}`} 
                      state={{ from: `${location.pathname}${location.search || ''}${location.hash || ''}` }}
                      _hover={{ textDecoration: 'none' }}
                    >
                      <HStack spacing={3} align="center" p={3} bg={shopBadgeBg} borderRadius="lg">
                        <Icon as={FaStore} color={shopBadgeText} boxSize={4} />
                        <Text fontWeight="600" color={shopBadgeText}>{shopName}</Text>
                      </HStack>
                    </ChakraLink>
                  </Box>
                )}
              </VStack>
            </ModalBody>

            {/* ✅ Actions fixes en bas */}
            <ModalFooter 
              pt={0}
              pb={4}
              position="sticky"
              bottom={0}
              bg={cardBg}
              borderTop="1px solid"
              borderColor={borderColor}
              borderRadius="0 0 1rem 1rem"
            >
              <HStack spacing={3} width="100%">
                <Button 
                  onClick={() => { addToCart(); onDetailClose(); }}
                  colorScheme="teal"
                  flex="1"
                  size="lg"
                  borderRadius="lg"
                  isDisabled={stock != null && stock <= 0}
                >
                  <HStack spacing={2}>
                    <Icon as={FaCartShopping} />
                    <Text>Ajouter au panier</Text>
                  </HStack>
                </Button>
                
                <Button
                  onClick={async () => {
                    const token = globalThis.localStorage?.getItem('token') ?? undefined
                    if (!token) { 
                      toast({ title: 'Connectez-vous', description: 'Veuillez vous connecter pour ajouter aux favoris.', status: 'info' }); 
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
                      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les favoris', status: 'error' })
                    }
                  }}
                  variant="outline"
                  size="lg"
                  borderRadius="lg"
                  flexShrink={0}
                >
                  <Icon as={liked ? FaHeart : FaRegHeart} color={liked ? 'red.400' : undefined} />
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Image Lightbox Modal */}
        <Modal isOpen={isImageOpen} onClose={onImageClose} size="full" isCentered>
          <ModalOverlay bg="blackAlpha.900" />
          <ModalContent bg="transparent" boxShadow="none" maxW="100vw" p={0}>
            <ModalCloseButton 
              color="white" 
              bg="blackAlpha.600" 
              _hover={{ bg: 'blackAlpha.800' }} 
              size="lg" 
              borderRadius="full" 
              zIndex={1} 
              position="fixed"
              top={4}
              right={4}
            />
            <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
                <Box
                  width="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                  position="relative"
                  px={4}
                >
                  {/* Prev button */}
                  {finalImages && finalImages.length > 1 && (
                    <Box
                      position="absolute"
                      left={4}
                      zIndex={2}
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                      cursor="pointer"
                      aria-hidden
                      color="white"
                    >
                      <Box bg="blackAlpha.500" p={2} borderRadius="full">
                        <Icon as={FaChevronLeft} boxSize={6} color="white" />
                      </Box>
                    </Box>
                  )}

                  <Image 
                    src={resolvedSrc ?? PRODUCT_PLACEHOLDER} 
                    alt={title} 
                    objectFit="contain" 
                    maxH="95vh" 
                    opacity={imageLoaded ? 1 : 0}
                    transition="opacity 300ms ease"
                    onLoad={() => setImageLoaded(true)}
                    onError={(e:any) => { e.currentTarget.src = PRODUCT_PLACEHOLDER }} 
                  />

                  {/* Next button */}
                  {finalImages && finalImages.length > 1 && (
                    <Box
                      position="absolute"
                      right={4}
                      zIndex={2}
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                      cursor="pointer"
                      aria-hidden
                      color="white"
                    >
                      <Box bg="blackAlpha.500" p={2} borderRadius="full">
                        <Icon as={FaChevronRight} boxSize={6} color="white" />
                      </Box>
                    </Box>
                  )}
                </Box>
              </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </ScaleFade>
  )
}