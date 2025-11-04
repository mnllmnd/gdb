import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
  Grid,
  GridItem
} from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight, FaBox, FaStar, FaInfoCircle } from 'react-icons/fa'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import ReviewForm from '../components/ReviewForm'
import ReviewsList from '../components/ReviewsList'
import BackButton from '../components/BackButton'

export default function ProductView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [imageIndex, setImageIndex] = React.useState(0)
  const [reviewsOpen, setReviewsOpen] = React.useState(false)
  const [reviewCount, setReviewCount] = React.useState(0)
  const touchStartRef = React.useRef<number | null>(null)
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure()

  // Theme-aware tokens
  const bgCard = useColorModeValue('white', 'gray.800')
  const bgSubtle = useColorModeValue('gray.50', 'gray.700')
  const textSecondary = useColorModeValue('gray.700', 'gray.300')
  const borderColorVar = useColorModeValue('gray.200','gray.700')
  const arrowBg = useColorModeValue('white','gray.800')
  const arrowHoverBg = useColorModeValue('gray.100','gray.700')
  const arrowIconColor = useColorModeValue('gray.700','white')

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        // Fetch the single product directly to avoid loading the entire product list
        const p = await api.products.get(String(id))
        if (!mounted) return
        setProduct(p || null)

        // Load review count for this product
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

  if (loading) return (
    <Container maxW="container.xl" py={12}>
      <Center><Spinner size="xl" thickness="3px" color="gray.600" /></Center>
    </Container>
  )

  if (!product) return (
    <Container maxW="container.xl" py={12}>
      <Box 
        textAlign="center" 
        bg={bgCard} 
        p={16} 
        borderRadius="xl" 
        border="1px solid"
  borderColor={borderColorVar}
      >
        <Icon as={FaBox} boxSize={20} color="gray.400" mb={6} />
        <Heading size="lg" mb={4} fontWeight="500">Produit introuvable</Heading>
        <Text color={textSecondary} mb={8} fontSize="lg">Le produit demandé est introuvable ou a été supprimé.</Text>
        <Button 
          variant="outline"
          size="lg" 
          onClick={() => navigate(location.state?.from || '/products')}
          borderColor="gray.300"
          _hover={{ bg: bgSubtle }}
        >
          Retour aux produits
        </Button>
      </Box>
    </Container>
  )

  // Build images array and deduplicate URLs client-side as a safety fallback
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
    <Container maxW="container.xl" py={8} pb={{ base: '120px', md: 8 }}>
      <BackButton to={location.state?.from} />
      
      {/* Main Product Grid */}
      <Grid 
        templateColumns={{ base: '1fr', lg: '1fr 400px' }} 
        gap={8} 
        alignItems="start"
      >
        {/* Left Column - Images & Details */}
        <GridItem>
          {/* Image Gallery */}
          <Box 
            bg={bgCard} 
            borderRadius="xl" 
            overflow="hidden" 
            border="1px solid"
            borderColor={borderColorVar}
            mb={6}
          >
            <Box position="relative">
              <Box 
                position="relative" 
                overflow="hidden" 
                height={{ base: '400px', md: '600px' }}
                bg="gray.50"
                onClick={onImageOpen} 
                onTouchStart={onTouchStart} 
                onTouchEnd={onTouchEnd}
                cursor="zoom-in"
                transition="all 0.2s ease-in-out"
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
                    {/* Navigation Arrows */}
                    {imgs.length > 1 && (
                      <>
                                <Box 
                                  position="absolute" 
                                  left={4} 
                                  top="50%" 
                                  transform="translateY(-50%)" 
                                  zIndex={2}
                                >
                                  <Box 
                                    bg={arrowBg} 
                                    p={3} 
                                    borderRadius="full" 
                                    onClick={(e) => { e.stopPropagation(); prev() }} 
                                    cursor="pointer"
                                    transition="all 0.2s"
                                    _hover={{ bg: arrowHoverBg, transform: 'scale(1.05)' }}
                                    boxShadow="md"
                                  >
                                    <Icon as={FaChevronLeft} color={arrowIconColor} boxSize={4} />
                                  </Box>
                                </Box>

                        <Box 
                          position="absolute" 
                          right={4} 
                          top="50%" 
                          transform="translateY(-50%)" 
                          zIndex={2}
                        >
                          <Box 
                            bg={arrowBg} 
                            p={3} 
                            borderRadius="full" 
                            onClick={(e) => { e.stopPropagation(); next() }} 
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{ bg: arrowHoverBg, transform: 'scale(1.05)' }}
                            boxShadow="md"
                          >
                            <Icon as={FaChevronRight} color={arrowIconColor} boxSize={4} />
                          </Box>
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
                      transition="opacity 300ms ease"
                      p={8}
                    />

                    {/* Image Counter */}
                    {imgs.length > 1 && (
                      <Badge 
                        position="absolute" 
                        bottom={4} 
                        right={4} 
                        bg="blackAlpha.800" 
                        color="white" 
                        px={3} 
                        py={1} 
                        borderRadius="md" 
                        fontSize="sm"
                        fontWeight="500"
                      >
                        {imageIndex + 1} / {imgs.length}
                      </Badge>
                    )}
                  </Box>
                )}
              </Box>

              {/* Thumbnails */}
              {imgs.length > 1 && (
                <Box px={6} py={4} bg="white" borderTop="1px solid" borderColor="gray.100">
                  <SimpleGrid columns={{ base: 4, md: 6 }} spacing={3}>
                    {imgs.map((src: string, idx: number) => (
                      <Box 
                        key={idx} 
                        border="2px solid" 
                        borderColor={idx === imageIndex ? 'gray.800' : 'gray.200'} 
                        borderRadius="md" 
                        overflow="hidden" 
                        cursor="pointer" 
                        onClick={() => setImageIndex(idx)}
                        transition="all 0.2s"
                        _hover={{ 
                          borderColor: 'gray.600',
                          transform: 'scale(1.02)'
                        }}
                      >
                        <Image 
                          src={highRes(src, { width: 400 }) ?? src} 
                          alt={`Vignette ${idx+1}`} 
                          objectFit="cover" 
                          width="100%" 
                          height="80px"
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Box>
          </Box>

          {/* Product Details Sections */}
          <VStack spacing={6} align="stretch">
            {/* Description Section */}
            <Box 
              bg="white" 
              p={6} 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="gray.200"
            >
              <HStack spacing={3} mb={4}>
                <Icon as={FaInfoCircle} color="gray.600" />
                <Heading size="md" fontWeight="600" color="gray.800">
                  Description
                </Heading>
              </HStack>
              {product.description ? (
                <Text color="gray.700" lineHeight="tall" fontSize="md">
                  {product.description}
                </Text>
              ) : (
                <Text color="gray.500" fontStyle="italic">
                  Aucune description disponible
                </Text>
              )}
            </Box>

            {/* Reviews Section */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              overflow="hidden"
              border="1px solid"
              borderColor="gray.200"
            >
              <Button
                width="100%"
                justifyContent="space-between"
                onClick={() => setReviewsOpen(!reviewsOpen)}
                bg="white"
                _hover={{ bg: 'gray.50' }}
                borderRadius="xl"
                py={6}
                px={6}
                rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} boxSize={5} />}
                borderBottomRadius={reviewsOpen ? 0 : 'xl'}
              >
                <HStack spacing={3}>
                  <Icon as={FaStar} color="gray.600" />
                  <Text fontSize="lg" fontWeight="600" color="gray.800">
                    Avis clients
                  </Text>
                  {reviewCount > 0 && (
                    <Badge bg="gray.100" color="gray.600" fontSize="sm" px={2} py={1} borderRadius="md">
                      {reviewCount}
                    </Badge>
                  )}
                </HStack>
              </Button>

              <Collapse in={reviewsOpen} animateOpacity>
                <Box p={6} bg="gray.50" borderTop="1px solid" borderColor="gray.200">
                  <Tabs variant="line" colorScheme="gray">
                    <TabList mb={6}>
                      <Tab fontWeight="500" color="gray.700">Voir les avis</Tab>
                      <Tab fontWeight="500" color="gray.700">Laisser un avis</Tab>
                    </TabList>

                    <TabPanels>
                      <TabPanel px={0}>
                        <Box 
                          maxH="400px" 
                          overflowY="auto" 
                          css={{
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' },
                            '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '10px' },
                          }}
                        >
                          <ReviewsList productId={String(product.id)} />
                        </Box>
                      </TabPanel>

                      <TabPanel px={0}>
                        <ReviewForm 
                          productId={String(product.id)} 
                          onSuccess={() => {
                            setReviewCount(prev => prev + 1)
                          }} 
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </Collapse>
            </Box>
          </VStack>
        </GridItem>

        {/* Right Column - Purchase Card */}
        <GridItem>
          <Box 
            position="sticky"
            top={8}
            bg="white" 
            borderRadius="xl" 
            p={6}
            border="1px solid"
            borderColor="gray.200"
            boxShadow="sm"
          >
            <VStack align="stretch" spacing={6}>
              {/* Product Title */}
              <Box>
                <Heading size="lg" mb={3} fontWeight="600" color="gray.900" lineHeight="1.2">
                  {product.title || product.name}
                </Heading>
                
                <HStack spacing={4} align="center" mb={3}>
                  <Text fontSize="2xl" fontWeight="700" color="gray.900">
                    {Math.floor(product.price)} FCFA
                  </Text>
                  {product.quantity !== undefined && product.quantity !== null && (
                    <Badge 
                      bg={product.quantity > 0 ? 'green.50' : 'red.50'} 
                      color={product.quantity > 0 ? 'green.700' : 'red.700'}
                      fontSize="sm" 
                      px={3} 
                      py={1} 
                      borderRadius="md"
                      border="1px solid"
                      borderColor={product.quantity > 0 ? 'green.200' : 'red.200'}
                    >
                      {product.quantity > 0 
                        ? `✓ En stock` 
                        : '✕ Rupture'
                      }
                    </Badge>
                  )}
                </HStack>

                {product.quantity > 0 && (
                  <Text color="gray.600" fontSize="sm">
                    {product.quantity} unités disponibles
                  </Text>
                )}
              </Box>

              <Divider />

              {/* Add to Cart Component */}
              <Box>
                <ProductCard
                  id={String(product.id)}
                  title={product.title || product.name}
                  price={product.price ?? product.amount}
                  image_url={product.image_url ?? product.product_image}
                  images={product.images}
                  quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
                 
                />
              </Box>
            </VStack>
          </Box>
        </GridItem>
      </Grid>

      {/* Fullscreen Lightbox Modal */}
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
            <Box width="100%" display="flex" alignItems="center" justifyContent="center" position="relative" px={4}>
              {imgs.length > 1 && (
                <Box 
                  position="absolute" 
                  left={6} 
                  zIndex={5} 
                  onClick={(e) => { e.stopPropagation(); prev() }} 
                  cursor="pointer"
                >
                  <Box 
                    bg="white" 
                    p={4} 
                    borderRadius="full"
                    transition="all 0.2s"
                    _hover={{ bg: 'gray.100', transform: 'scale(1.1)' }}
                    boxShadow="lg"
                  >
                    <Icon as={FaChevronLeft} boxSize={6} color="gray.700" />
                  </Box>
                </Box>
              )}

              <Image 
                src={highRes(imgs[imageIndex] ?? imgs[0], { width: 1200, quality: 80 }) ?? (imgs[imageIndex] ?? imgs[0])} 
                alt={product.title || product.name} 
                objectFit="contain" 
                maxH="95vh" 
              />

              {imgs.length > 1 && (
                <Box 
                  position="absolute" 
                  right={6} 
                  zIndex={5} 
                  onClick={(e) => { e.stopPropagation(); next() }} 
                  cursor="pointer"
                >
                  <Box 
                    bg="white" 
                    p={4} 
                    borderRadius="full"
                    transition="all 0.2s"
                    _hover={{ bg: 'gray.100', transform: 'scale(1.1)' }}
                    boxShadow="lg"
                  >
                    <Icon as={FaChevronRight} boxSize={6} color="gray.700" />
                  </Box>
                </Box>
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}