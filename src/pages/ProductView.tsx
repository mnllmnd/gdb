import React from 'react'
import { useParams, useNavigate, useLocation, useNavigationType } from 'react-router-dom'
import { 
  Container, 
  Heading, 
  Box, 
  Image, 
  Text, 
  Spinner, 
  Center, 
  Button, 
  Icon, 
  Badge, 
  SimpleGrid, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalBody, 
  ModalCloseButton, 
  useColorModeValue,
  useDisclosure,
  VStack,
  HStack,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Collapse,
  Flex
} from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight, FaBox, FaStar, FaInfoCircle } from 'react-icons/fa'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import ReviewForm from '../components/ReviewForm'
import ReviewsList from '../components/ReviewsList'
import ScrollTopButton from '../components/ScrollTopButton'
import { usePageState } from '../components/ScrollRestoration'

export default function ProductView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [imageIndex, setImageIndex] = React.useState(0)
  const [reviewsOpen, setReviewsOpen] = React.useState(false)
  const [descriptionOpen, setDescriptionOpen] = React.useState(false)
  const [reviewCount, setReviewCount] = React.useState(0)
  const touchStartRef = React.useRef<number | null>(null)
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure()

  const navigationType = useNavigationType()
  const pageState = usePageState()
  
  React.useEffect(() => {
    try {
      if (navigationType === 'POP') {
        const restored = pageState.restore()
        if (restored) {
          if (typeof restored.imageIndex === 'number') setImageIndex(restored.imageIndex)
          if (typeof restored.reviewsOpen === 'boolean') setReviewsOpen(restored.reviewsOpen)
        }
      }
    } catch (err) {
      console.warn('Failed to restore ProductView page state', err)
    }

    return () => {
      try {
        pageState.save({ imageIndex, reviewsOpen })
      } catch (err) {
        console.warn('Failed to save ProductView page state', err)
      }
    }
  }, [location.key, navigationType, imageIndex, reviewsOpen])

  const bgCard = useColorModeValue('white', 'gray.800')
  const textPrimary = useColorModeValue('gray.900', 'white')
  const textSecondary = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.200','gray.700')
  const bgHover = useColorModeValue('gray.50', 'gray.700')

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const p = await api.products.get(String(id))
        if (!mounted) return
        setProduct(p || null)

        if (p) {
          try {
            const reviews = await api.reviews.list({ product_id: p.id, limit: 1 })
            if (mounted) setReviewCount(reviews?.aggregate?.count || 0)
          } catch (err) {
            console.warn('Failed to load review count', err)
          }
        }
      } catch (err) {
        console.error('Failed to load product', err)
        if (mounted) setProduct(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const [similarProducts, setSimilarProducts] = React.useState<any[]>([])
  const [similarLoading, setSimilarLoading] = React.useState(false)
  
  React.useEffect(() => {
    let mounted = true
    const loadSimilar = async () => {
      if (!product || !product.id) return
      setSimilarLoading(true)
      try {
        const sims = await api.products.similar(String(product.id), 8)
        if (!mounted) return
        setSimilarProducts(Array.isArray(sims) ? sims : [])
      } catch (err) {
        console.warn('Failed to load similar products', err)
      } finally {
        if (mounted) setSimilarLoading(false)
      }
    }
    loadSimilar()
    return () => { mounted = false }
  }, [product && product.id])

  if (loading) return (
    <Container maxW="container.xl" py={12}>
      <Center><Spinner size="xl" thickness="3px" color="gray.600" /></Center>
    </Container>
  )

  if (!product) return (
    <Container maxW="container.xl" py={12}>
      <Box textAlign="center" bg={bgCard} p={16} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Icon as={FaBox} boxSize={20} color="gray.400" mb={6} />
        <Heading size="lg" mb={4} fontWeight="500">Produit introuvable</Heading>
        <Text color={textSecondary} mb={8} fontSize="lg">Le produit demandé est introuvable ou a été supprimé.</Text>
        <Button 
          variant="outline"
          size="lg" 
          onClick={() => navigate(location.state?.from || '/products')}
          borderColor={borderColor}
          _hover={{ bg: bgHover }}
        >
          Retour aux produits
        </Button>
      </Box>
    </Container>
  )

  let imgs: string[] = []
  if (product?.images && Array.isArray(product.images) && product.images.length) {
    imgs = Array.from(new Set((product.images || []).map(String).filter(Boolean)))
  } else if (product?.image_url) {
    imgs = [String(product.image_url)]
  } else if (product?.product_image) {
    imgs = [String(product.product_image)]
  }
  const currentSrc = highRes(imgs[imageIndex] ?? imgs[0], { width: 1200, quality: 80 }) ?? (imgs[imageIndex] ?? imgs[0])

  const next = () => setImageIndex(i => imgs.length ? (i + 1) % imgs.length : 0)
  const prev = () => setImageIndex(i => imgs.length ? (i - 1 + imgs.length) % imgs.length : 0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches?.[0]?.clientX ?? null }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current
    const end = e.changedTouches?.[0]?.clientX ?? null
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) < 30) return
    if (delta < 0) next()
    else prev()
  }

  return (
    <Container maxW="1400px" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      {/* Layout Style Zara: Image à gauche, Infos à droite */}
      <Flex 
        direction={{ base: 'column', lg: 'row' }} 
        gap={{ base: 6, lg: 10 }}
        align="flex-start"
      >
        {/* Galerie d'images - 60% de largeur sur desktop */}
        <Box flex={{ base: '1', lg: '0 0 60%' }}>
          {/* Image principale */}
          <Box 
            position="relative"
            bg={bgCard}
            borderRadius="sm"
            overflow="hidden"
            mb={4}
          >
            <Box 
              position="relative" 
              height={{ base: '70vh', md: '80vh' }}
              bg="gray.50"
              onClick={onImageOpen} 
              onTouchStart={onTouchStart} 
              onTouchEnd={onTouchEnd}
              cursor="zoom-in"
            >
              {imgs.length === 0 ? (
                <Image 
                  src={PRODUCT_PLACEHOLDER} 
                  alt="Produit" 
                  objectFit="cover" 
                  width="100%" 
                  height="100%" 
                />
              ) : (
                <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
                  {/* Flèches de navigation minimalistes */}
                  {imgs.length > 1 && (
                    <>
                      <Box 
                        position="absolute" 
                        left={3} 
                        top="50%" 
                        transform="translateY(-50%)" 
                        zIndex={2}
                        onClick={(e) => { e.stopPropagation(); prev() }}
                        cursor="pointer"
                        bg="white"
                        p={2}
                        borderRadius="full"
                        opacity={0.9}
                        _hover={{ opacity: 1 }}
                        transition="all 0.2s"
                      >
                        <Icon as={FaChevronLeft} boxSize={5} />
                      </Box>

                      <Box 
                        position="absolute" 
                        right={3} 
                        top="50%" 
                        transform="translateY(-50%)" 
                        zIndex={2}
                        onClick={(e) => { e.stopPropagation(); next() }}
                        cursor="pointer"
                        bg="white"
                        p={2}
                        borderRadius="full"
                        opacity={0.9}
                        _hover={{ opacity: 1 }}
                        transition="all 0.2s"
                      >
                        <Icon as={FaChevronRight} boxSize={5} />
                      </Box>
                    </>
                  )}

                  <Image 
                    key={imgs[imageIndex] ?? 'img'} 
                    src={currentSrc ?? PRODUCT_PLACEHOLDER} 
                    alt={product.title || product.name} 
                    objectFit="contain" 
                    width="100%" 
                    height="100%" 
                    transition="opacity 200ms"
                    p={4}
                  />

                  {/* Compteur d'images */}
                  {imgs.length > 1 && (
                    <Text 
                      position="absolute" 
                      bottom={4} 
                      right={4} 
                      bg="blackAlpha.700"
                      color="white" 
                      px={3} 
                      py={1} 
                      borderRadius="sm" 
                      fontSize="xs"
                      fontWeight="500"
                    >
                      {imageIndex + 1} / {imgs.length}
                    </Text>
                  )}
                </Box>
              )}
            </Box>

            {/* Vignettes minimalistes */}
            {imgs.length > 1 && (
              <HStack spacing={2} p={3} overflowX="auto" css={{
                '&::-webkit-scrollbar': { height: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '2px' },
              }}>
                {imgs.map((src: string, idx: number) => (
                  <Box 
                    key={idx} 
                    minW="60px"
                    h="80px"
                    border="2px solid" 
                    borderColor={idx === imageIndex ? 'gray.900' : 'gray.200'} 
                    overflow="hidden" 
                    cursor="pointer" 
                    onClick={() => setImageIndex(idx)}
                    transition="all 0.2s"
                    opacity={idx === imageIndex ? 1 : 0.6}
                    _hover={{ opacity: 1 }}
                  >
                    <Image 
                      src={highRes(src, { width: 200 }) ?? src} 
                      alt={`Vue ${idx+1}`} 
                      objectFit="cover" 
                      width="100%" 
                      height="100%"
                    />
                  </Box>
                ))}
              </HStack>
            )}
          </Box>
        </Box>

        {/* Informations produit - 40% sur desktop, sticky */}
        <Box 
          flex={{ base: '1', lg: '0 0 38%' }}
          position={{ base: 'relative', lg: 'sticky' }}
          top={{ lg: 8 }}
          maxH={{ lg: 'calc(100vh - 4rem)' }}
          overflowY={{ lg: 'auto' }}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '3px' },
          }}
        >
          <VStack align="stretch" spacing={6}>
            {/* Titre et Prix */}
            <Box>
              <Heading 
                size="lg" 
                mb={4} 
                fontWeight="400" 
                color={textPrimary}
                letterSpacing="tight"
              >
                {product.title || product.name}
              </Heading>
              
              <HStack spacing={3} mb={4}>
                {product.discount > 0 && (
                  <>
                    <Text
                      fontSize="xl"
                      textDecoration="line-through"
                      color={textSecondary}
                      fontWeight="300"
                    >
                      {Math.floor(product.original_price)} FCFA
                    </Text>
                    <Badge 
                      colorScheme="red" 
                      fontSize="sm" 
                      px={2} 
                      py={1}
                      fontWeight="500"
                    >
                      -{product.discount}%
                    </Badge>
                  </>
                )}
              </HStack>
              
              <Text 
                fontSize="3xl" 
                fontWeight="500" 
                color={product.discount > 0 ? "red.600" : textPrimary}
                mb={4}
              >
                {Math.floor(product.price)} FCFA
              </Text>

              {/* Stock */}
              {product.quantity !== undefined && product.quantity !== null && (
                <HStack spacing={2} mb={2}>
                  <Box 
                    w={2} 
                    h={2} 
                    borderRadius="full" 
                    bg={product.quantity > 0 ? 'green.500' : 'red.500'} 
                  />
                  <Text 
                    fontSize="sm" 
                    color={textSecondary}
                    fontWeight="400"
                  >
                    {product.quantity > 0 
                      ? `En stock (${product.quantity} disponibles)` 
                      : 'Rupture de stock'
                    }
                  </Text>
                </HStack>
              )}
            </Box>

            {/* Bouton Panier - En haut, directement visible */}
            <Box mb={2}>
              <ProductCard
                id={String(product.id)}
                title={product.title || product.name}
                price={product.price ?? product.amount}
                originalPrice={product.original_price ?? product.originalPrice}
                discount={product.discount ?? 0}
                image_url={product.image_url ?? product.product_image}
                images={product.images}
                quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
              />
            </Box>

            <Divider borderColor={borderColor} />

            {/* Description accordéon */}
            <Box borderTop="1px solid" borderColor={borderColor}>
              <Button
                width="100%"
                justifyContent="space-between"
                onClick={() => setDescriptionOpen(!descriptionOpen)}
                variant="ghost"
                fontWeight="500"
                py={6}
                px={0}
                _hover={{ bg: 'transparent' }}
                rightIcon={<Icon as={descriptionOpen ? ChevronUpIcon : ChevronDownIcon} />}
              >
                <HStack spacing={2}>
                  <Icon as={FaInfoCircle} color={textSecondary} boxSize={4} />
                  <Text color={textPrimary}>Description</Text>
                </HStack>
              </Button>

              <Collapse in={descriptionOpen} animateOpacity>
                <Box pb={6}>
                  {product.description ? (
                    <Text color={textSecondary} lineHeight="tall" fontSize="sm">
                      {product.description}
                    </Text>
                  ) : (
                    <Text color={textSecondary} fontStyle="italic" fontSize="sm">
                      Aucune description disponible
                    </Text>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* Avis accordéon */}
            <Box borderTop="1px solid" borderColor={borderColor}>
              <Button
                width="100%"
                justifyContent="space-between"
                onClick={() => setReviewsOpen(!reviewsOpen)}
                variant="ghost"
                fontWeight="500"
                py={6}
                px={0}
                _hover={{ bg: 'transparent' }}
                rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} />}
              >
                <HStack spacing={2}>
                  <Icon as={FaStar} color={textSecondary} boxSize={4} />
                  <Text color={textPrimary}>Avis clients</Text>
                  {reviewCount > 0 && (
                    <Text fontSize="sm" color={textSecondary}>({reviewCount})</Text>
                  )}
                </HStack>
              </Button>

              <Collapse in={reviewsOpen} animateOpacity>
                <Box pb={6}>
                  <Tabs variant="unstyled" colorScheme="gray">
                    <TabList mb={4} borderBottom="1px solid" borderColor={borderColor}>
                      <Tab 
                        fontSize="sm" 
                        fontWeight="500"
                        _selected={{ borderBottom: '2px solid', borderColor: 'gray.900', color: textPrimary }}
                        color={textSecondary}
                      >
                        Voir les avis
                      </Tab>
                      <Tab 
                        fontSize="sm" 
                        fontWeight="500"
                        _selected={{ borderBottom: '2px solid', borderColor: 'gray.900', color: textPrimary }}
                        color={textSecondary}
                      >
                        Laisser un avis
                      </Tab>
                    </TabList>

                    <TabPanels>
                      <TabPanel px={0}>
                        <Box maxH="400px" overflowY="auto">
                          <ReviewsList productId={String(product.id)} />
                        </Box>
                      </TabPanel>

                      <TabPanel px={0}>
                        <ReviewForm 
                          productId={String(product.id)} 
                          onSuccess={() => setReviewCount(prev => prev + 1)} 
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </Collapse>
            </Box>
          </VStack>
        </Box>
      </Flex>

      {/* Modal plein écran */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" boxShadow="none" maxW="100vw" p={0}>
          <ModalCloseButton 
            color="white" 
            bg="blackAlpha.600" 
            _hover={{ bg: 'blackAlpha.800' }} 
            size="lg" 
            borderRadius="full" 
            zIndex={10} 
            position="fixed" 
            top={6} 
            right={6} 
          />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
            <Box width="100%" display="flex" alignItems="center" justifyContent="center" position="relative">
              {imgs.length > 1 && (
                <>
                  <Box 
                    position="absolute" 
                    left={6} 
                    onClick={(e) => { e.stopPropagation(); prev() }} 
                    cursor="pointer"
                    bg="white"
                    p={3}
                    borderRadius="full"
                    _hover={{ bg: 'gray.100' }}
                  >
                    <Icon as={FaChevronLeft} boxSize={6} />
                  </Box>

                  <Box 
                    position="absolute" 
                    right={6} 
                    onClick={(e) => { e.stopPropagation(); next() }} 
                    cursor="pointer"
                    bg="white"
                    p={3}
                    borderRadius="full"
                    _hover={{ bg: 'gray.100' }}
                  >
                    <Icon as={FaChevronRight} boxSize={6} />
                  </Box>
                </>
              )}

              <Image 
                src={highRes(imgs[imageIndex] ?? imgs[0], { width: 1200, quality: 80 }) ?? (imgs[imageIndex] ?? imgs[0])} 
                alt={product.title || product.name} 
                objectFit="contain" 
                maxH="95vh" 
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ScrollTopButton />

      {/* Produits similaires */}
      {(similarProducts.length > 0 || similarLoading) && (
        <Box mt={16} pt={8} borderTop="1px solid" borderColor={borderColor}>
          <Heading size="md" mb={6} fontWeight="400" letterSpacing="tight">
            Vous aimerez aussi
          </Heading>
          {similarLoading ? (
            <Center py={8}><Spinner /></Center>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              {similarProducts.map((p: any) => (
                <Box key={p.id} id={`product-${p.id}`}> 
                  <ProductCard
                    id={String(p.id)}
                    title={p.title || p.name}
                    price={p.price ?? p.amount}
                    originalPrice={p.original_price ?? p.originalPrice}
                    discount={p.discount ?? 0}
                    image_url={p.image_url}
                    images={p.images}
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}
    </Container>
  )
}