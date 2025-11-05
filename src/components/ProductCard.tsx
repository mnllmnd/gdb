import React, { useState } from 'react'
import { 
  Box, Image, Heading, Text, Stack, Button, useToast, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, 
  FormControl, FormLabel, Input, Textarea, useDisclosure, useBreakpointValue, 
  Link as ChakraLink, Badge, HStack, VStack, Icon, Flex, ScaleFade, Fade, SimpleGrid,
  useColorModeValue, AspectRatio
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { FaStore, FaShoppingCart, FaEye, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import cart from '../utils/cart'
import { getItem } from '../utils/localAuth'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import { FaCartShopping } from 'react-icons/fa6'

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
  height = { base: '280px', md: '320px' },
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
  
  // Couleurs style Nike/Zara
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('#e5e5e5', 'gray.600')
  const textColor = useColorModeValue('#111111', 'white')
  const subtleTextColor = useColorModeValue('#666666', 'gray.400')
  const priceText = useColorModeValue('#111111', 'white')
  const shopBadgeBg = useColorModeValue('#f8f8f8', 'gray.700')
  const shopBadgeText = useColorModeValue('#111111', 'white')
  const accentColor = useColorModeValue('#111111', 'white')
  const hoverShadow = useColorModeValue('0 8px 25px rgba(0,0,0,0.15)', '0 8px 25px rgba(0,0,0,0.4)')
  const ctaBg = useColorModeValue('white', 'black')

  const numericPrice = (() => {
    if (typeof price === 'number') return price
    if (typeof price === 'string' && price.trim() !== '') {
      const n = Number(price)
      return Number.isFinite(n) ? n : null
    }
    return null
  })()

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
  
  // Configuration mobile améliorée
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

  React.useEffect(() => { setStock(quantity ?? null) }, [quantity])

  // Gestion de la fermeture par swipe down sur mobile
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchEndY, setTouchEndY] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndY(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (touchStartY - touchEndY > 100) {
      // Swipe down - fermer la modale
      onDetailClose()
    }
  }

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
        borderWidth="0.6px"
        borderRadius="none"
        overflow="hidden"
        bg={ctaBg}
        boxShadow="sm"
        transition="all 0.3s ease"
        _hover={{ 
          transform: 'translateY(-8px)',
          boxShadow: hoverShadow,
          borderColor: accentColor
        }}
        position="relative"
        borderColor={borderColor}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        height="100%"
        display="flex"
        flexDirection="column"
        width="100%"
      >
        {/* Image Section */}
        <Box 
          position="relative" 
          height={height} 
          bg="ctaBg" 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          overflow="hidden"
          cursor="pointer"
          onClick={onDetailOpen}
        >
          <Box position="relative" width="100%" height="100%">
            {finalImages && finalImages.length > 0 ? (
              finalImages.map((src, idx) => {
                const resolved = (highRes(src, { width: 1200, quality: 90 }) ?? src) as string
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
                    transform={visible ? 'scale(1.05)' : 'scale(1)'}
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
          
          {/* Hover Overlay */}
          <Fade in={isHovered}>
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="ctaBg"
              display="flex"
              alignItems="flex-end"
              justifyContent="flex-start"
              p={3}
            >
              <Badge 
                bg="ctaBg" 
                color="ctaBg" 
                px={3} 
                py={2}
                borderRadius="none"
                fontSize="xs"
                fontWeight="600"
                letterSpacing="0.5px"
              >
                <HStack spacing={2}>
                  <Icon as={FaEye} />
                  <Text>Voir les détails</Text>
                </HStack>
              </Badge>
            </Box>
          </Fade>

          {finalImages && finalImages.length > 1 && (
            <Badge
              position="absolute"
              top="12px"
              right="12px"
              bg="white"
              color="#111111"
              px={3}
              py={1}
              borderRadius="none"
              fontSize="xs"
              fontWeight="700"
              border="1px solid"
              borderColor={borderColor}
            >
              +{finalImages.length}
            </Badge>
          )}

          {stock != null && stock <= 0 && (
            <Badge 
              position="absolute" 
              top="12px" 
              left="12px" 
              bg="#111111"
              color="white"
              px={3} 
              py={1} 
              borderRadius="none" 
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
            >
              Rupture
            </Badge>
          )}
        </Box>

        {/* Content Section */}
        <Box p={4} flex="1" display="flex" flexDirection="column">
          <VStack spacing={3} align="stretch" flex="1">
            {shopName && (
              <Text 
                fontSize="xs" 
                fontWeight="600" 
                color={subtleTextColor}
                letterSpacing="0.5px"
                textTransform="uppercase"
              >
                {shopName}
              </Text>
            )}

            <Heading 
              size="sm" 
              color={textColor} 
              fontWeight="600" 
              noOfLines={2}
              lineHeight="1.3"
              minH="2.6rem"
              fontSize={{ base: 'sm', md: 'md' }}
              letterSpacing="-0.2px"
            >
              {title || 'Sans titre'}
            </Heading>

            {description && (
              <Text fontSize="sm" color={subtleTextColor} noOfLines={2} lineHeight="1.4">
                {description}
              </Text>
            )}

            {formattedPrice && (
              <Flex align="center" justify="space-between" mt="auto">
                <Text 
                  fontSize="lg" 
                  fontWeight="700" 
                  color={priceText}
                  letterSpacing="-0.5px"
                >
                  {formattedPrice} FCFA
                </Text>
                
                {likesCount != null && (
                  <HStack spacing={1}>
                    <Icon as={FaHeart} color="red.400" boxSize={3} />
                    <Text fontSize="sm" color={subtleTextColor} fontWeight="500">
                      {likesCount}
                    </Text>
                  </HStack>
                )}
              </Flex>
            )}

            <VStack spacing={2} mt={3}>
              <HStack width="100%" spacing={2}>
                <Button 
                  onClick={addToCart}
                  flex="1"
                  borderRadius="none"
                  size="md"
                  height="42px"
                  variant="solid"
                  bg={ctaBg}
                  color="ctaBg"
                  isDisabled={stock != null && stock <= 0}
                  _hover={{ 
                    bg: '#333333',
                    transform: 'translateY(-1px)',
                  }}
                  _active={{
                    bg: '#111111',
                    transform: 'translateY(0)',
                  }}
                  fontWeight="600"
                  fontSize="sm"
                  transition="all 0.2s ease"
                >
                  <HStack spacing={2}>
                    <Icon as={FaCartShopping} />
                    <Text>Ajouter</Text>
                  </HStack>
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
                  size="md"
                  height="42px"
                  borderRadius="none"
                  variant="outline"
                  borderColor={borderColor}
                  _hover={{
                    borderColor: accentColor,
                    bg: 'transparent'
                  }}
                  flexShrink={0}
                  minW="42px"
                  px={0}
                >
                  <Icon as={liked ? FaHeart : FaRegHeart} color={liked ? 'red.400' : subtleTextColor} />
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* ✅ Modal détaillée avec fermeture mobile améliorée */}
        <Modal 
          isOpen={isDetailOpen} 
          onClose={onDetailClose} 
          size={modalSize}
          isCentered
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent 
            borderRadius="none"
            maxW={{ base: '100vw', md: '90vw', lg: '1200px' }}
            maxH={modalMaxHeight}
            mx={{ base: 0, md: 0 }}
            my={{ base: 0, md: 0 }}
            bg={cardBg}
          >
            {/* Header avec bouton de fermeture mobile amélioré */}
            <ModalHeader 
              pb={3} 
              borderBottom="1px solid" 
              borderColor={borderColor}
              position="relative"
              pr="70px"
            >
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="700" noOfLines={2} color={textColor}>
                  {title}
                </Text>
                {shopName && (
                  <Text fontSize="sm" color={subtleTextColor} fontWeight="500">
                    {shopName}
                  </Text>
                )}
              </VStack>
            </ModalHeader>
            
            {/* Bouton de fermeture mobile très accessible */}
            <ModalCloseButton 
              size="lg"
              position="absolute"
              top={4}
              right={4}
              bg={isMobile ? "blackAlpha.800" : "blackAlpha.700"}
              color="white"
              _hover={{ bg: 'blackAlpha.900' }}
              borderRadius="none"
              width={isMobile ? "48px" : "40px"}
              height={isMobile ? "48px" : "40px"}
              fontSize={isMobile ? "18px" : "16px"}
              zIndex={10}
            />
            
            {/* Modal Body avec support swipe down sur mobile */}
            <ModalBody 
              pb={6} 
              px={0}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchMove={isMobile ? handleTouchMove : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
            >
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={0}>
                {/* Image Gallery */}
                <Box 
                  position="relative" 
                  height={{ base: '300px', md: '500px', lg: '600px' }}
                  bg="gray.50"
                >
                  <Box 
                    width="100%" 
                    height="100%"
                    position="relative"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
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
                        <Button
                          position="absolute"
                          left={4}
                          top="50%"
                          transform="translateY(-50%)"
                          bg="blackAlpha.600"
                          color="white"
                          borderRadius="none"
                          _hover={{ bg: 'blackAlpha.800' }}
                          onClick={(e) => { e.stopPropagation(); prevImage() }}
                          size="sm"
                        >
                          <Icon as={FaChevronLeft} />
                        </Button>
                        <Button
                          position="absolute"
                          right={4}
                          top="50%"
                          transform="translateY(-50%)"
                          bg="blackAlpha.600"
                          color="white"
                          borderRadius="none"
                          _hover={{ bg: 'blackAlpha.800' }}
                          onClick={(e) => { e.stopPropagation(); nextImage() }}
                          size="sm"
                        >
                          <Icon as={FaChevronRight} />
                        </Button>
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
                        borderRadius="none" 
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
                            borderRadius="none" 
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
                      <Text fontSize="3xl" fontWeight="700" color={textColor}>
                        {formattedPrice ? `${formattedPrice} FCFA` : 'Prix indisponible'}
                      </Text>
                      
                      {stock != null && (
                        <Badge 
                          bg={stock > 0 ? '#111111' : '#666666'}
                          color="white"
                          fontSize="sm" 
                          px={4} 
                          py={2}
                          borderRadius="none"
                          fontWeight="600"
                          textTransform="uppercase"
                        >
                          {stock > 0 ? `En stock (${stock})` : 'Rupture de stock'}
                        </Badge>
                      )}
                    </VStack>

                    {description && (
                      <Box>
                        <Text fontWeight="700" mb={3} color={textColor} fontSize="lg">
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
                        color="textcolor"
                        size="lg"
                        height="56px"
                        borderRadius="none"
                        width="100%"
                        isDisabled={stock != null && stock <= 0}
                        _hover={{ bg: '#333333' }}
                        _active={{ bg: '#111111' }}
                        fontWeight="600"
                        fontSize="md"
                      >
                        <HStack spacing={3}>
                          <Icon as={FaCartShopping} boxSize={5} />
                          <Text>Ajouter au panier</Text>
                        </HStack>
                      </Button>
                      
                      <HStack spacing={3} width="100%">
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
                          height="56px"
                          borderRadius="none"
                          borderColor={borderColor}
                          flex="1"
                          _hover={{ borderColor: accentColor }}
                          fontWeight="600"
                        >
                          <HStack spacing={2}>
                            <Icon as={liked ? FaHeart : FaRegHeart} color={liked ? 'red.400' : undefined} />
                            <Text>{liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </VStack>
                  </VStack>
                </Box>
              </SimpleGrid>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </ScaleFade>
  )
}