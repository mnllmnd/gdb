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
  useDisclosure,
  VStack,
  HStack,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Collapse
} from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight, FaBox, FaStore } from 'react-icons/fa'
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

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const list = await api.products.list()
        if (!mounted) return
        const p = (list || []).find((x: any) => String(x.id) === String(id))
        setProduct(p || null)

        // Load review count
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
    <Container maxW="container.lg" py={8}>
      <Center><Spinner size="xl" thickness="4px" color="brand.500" /></Center>
    </Container>
  )

  if (!product) return (
    <Container maxW="container.lg" py={8}>
      <Box 
        textAlign="center" 
        bg="white" 
        p={12} 
        borderRadius="xl" 
        boxShadow="lg"
      >
        <Icon as={FaBox} boxSize={16} color="gray.400" mb={4} />
        <Heading size="lg" mb={3}>Produit introuvable</Heading>
        <Text color="gray.600" mb={6}>Le produit demandé est introuvable ou a été supprimé.</Text>
        <Button 
          colorScheme="brand" 
          size="lg" 
          onClick={() => navigate(location.state?.from || '/products')}
        >
          Retour aux produits
        </Button>
      </Box>
    </Container>
  )

  const imgs: string[] = (product?.images && product.images.length) ? product.images : (product?.image_url ? [product.image_url] : (product?.product_image ? [product.product_image] : []))
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
    <Container maxW="container.lg" py={8} pb={{ base: '120px', md: 8 }}>
      <BackButton to={location.state?.from} />
      
      {/* Product Card Container */}
      <Box 
        bg="white" 
        borderRadius="2xl" 
        overflow="hidden" 
        boxShadow="xl"
        border="1px solid"
        borderColor="gray.100"
      >
        {/* Image Gallery Section */}
        <Box position="relative">
          <Box 
            position="relative" 
            overflow="hidden" 
            height={{ base: '350px', md: '500px' }}
            bg="gray.50"
            onClick={onImageOpen} 
            onTouchStart={onTouchStart} 
            onTouchEnd={onTouchEnd}
            cursor="zoom-in"
            transition="all 0.3s"
            _hover={{ transform: 'scale(1.02)' }}
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
                {/* Prev Button */}
                {imgs.length > 1 && (
                  <Box 
                    position="absolute" 
                    left={4} 
                    top="50%" 
                    transform="translateY(-50%)" 
                    zIndex={2}
                  >
                    <Box 
                      bg="blackAlpha.700" 
                      p={3} 
                      borderRadius="full" 
                      onClick={(e) => { e.stopPropagation(); prev() }} 
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: 'blackAlpha.800', transform: 'scale(1.1)' }}
                    >
                      <Icon as={FaChevronLeft} color="white" boxSize={6} />
                    </Box>
                  </Box>
                )}

                <Image 
                  key={imgs[imageIndex] ?? 'img'} 
                  src={currentSrc ?? PRODUCT_PLACEHOLDER} 
                  alt={product.title || product.name} 
                  objectFit="contain" 
                  width="100%" 
                  height="100%" 
                  transition="opacity 300ms ease"
                  p={4}
                />

                {/* Next Button */}
                {imgs.length > 1 && (
                  <Box 
                    position="absolute" 
                    right={4} 
                    top="50%" 
                    transform="translateY(-50%)" 
                    zIndex={2}
                  >
                    <Box 
                      bg="blackAlpha.700" 
                      p={3} 
                      borderRadius="full" 
                      onClick={(e) => { e.stopPropagation(); next() }} 
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: 'blackAlpha.800', transform: 'scale(1.1)' }}
                    >
                      <Icon as={FaChevronRight} color="white" boxSize={6} />
                    </Box>
                  </Box>
                )}

                {/* Image Counter */}
                {imgs.length > 1 && (
                  <Badge 
                    position="absolute" 
                    bottom={4} 
                    right={4} 
                    bg="blackAlpha.700" 
                    color="white" 
                    px={3} 
                    py={2} 
                    borderRadius="lg" 
                    fontSize="sm"
                    fontWeight="600"
                  >
                    {imageIndex + 1} / {imgs.length}
                  </Badge>
                )}
              </Box>
            )}
          </Box>

          {/* Thumbnails */}
          {imgs.length > 1 && (
            <Box px={6} py={4} bg="gray.50">
              <SimpleGrid columns={{ base: 4, md: 6, lg: 8 }} spacing={3}>
                {imgs.map((src: string, idx: number) => (
                  <Box 
                    key={idx} 
                    border="2px solid" 
                    borderColor={idx === imageIndex ? 'brand.500' : 'gray.200'} 
                    borderRadius="lg" 
                    overflow="hidden" 
                    cursor="pointer" 
                    onClick={() => setImageIndex(idx)}
                    transition="all 0.2s"
                    _hover={{ 
                      borderColor: 'brand.400',
                      transform: 'translateY(-2px)',
                      boxShadow: 'md'
                    }}
                  >
                    <Image 
                      src={highRes(src, { width: 400 }) ?? src} 
                      alt={`Vignette ${idx+1}`} 
                      objectFit="cover" 
                      width="100%" 
                      height={{ base: '60px', md: '80px' }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Box>

        {/* Product Info Section */}
        <VStack align="stretch" spacing={6} p={6}>
          {/* Title and Price */}
          <Box>
            <Heading size="xl" mb={3} color="gray.800">
              {product.title || product.name}
            </Heading>
            <HStack spacing={4} align="center">
              <Text fontSize="3xl" fontWeight="800" color="brand.600">
                {Math.floor(product.price)} FCFA
              </Text>
              {typeof product.quantity !== 'undefined' && product.quantity !== null && (
                <Badge 
                  colorScheme={product.quantity > 0 ? 'green' : 'red'} 
                  fontSize="md" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                >
                  {product.quantity > 0 
                    ? `✓ En stock (${product.quantity})` 
                    : '✕ Rupture de stock'
                  }
                </Badge>
              )}
            </HStack>
          </Box>

          <Divider />

          {/* Description */}
          {product.description && (
            <Box>
              <Text fontSize="md" fontWeight="600" color="gray.700" mb={2}>
                📋 Description
              </Text>
              <Text color="gray.600" lineHeight="tall">
                {product.description}
              </Text>
            </Box>
          )}

          <Divider />

          {/* Add to Cart Card */}
          <Box display={{ base: 'block', md: 'none' }}>
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

      {/* Reviews Section - Collapsible */}
      <Box 
        mt={6}
        borderRadius="xl" 
        overflow="hidden"
        bg="white"
        boxShadow="lg"
        border="1px solid"
        borderColor="gray.100"
      >
        <Button
          width="100%"
          justifyContent="space-between"
          onClick={() => setReviewsOpen(!reviewsOpen)}
          bg="gray.50"
          _hover={{ bg: 'gray.100' }}
          borderRadius="0"
          py={6}
          px={6}
          rightIcon={<Icon as={reviewsOpen ? ChevronUpIcon : ChevronDownIcon} boxSize={6} />}
        >
          <HStack spacing={3}>
            <Text fontSize="lg" fontWeight={700} color="gray.800">
              ⭐ Avis clients
            </Text>
            {reviewCount > 0 && (
              <Badge colorScheme="brand" fontSize="md" px={3} py={1} borderRadius="full">
                {reviewCount}
              </Badge>
            )}
          </HStack>
        </Button>

        <Collapse in={reviewsOpen} animateOpacity>
          <Box p={6} bg="gray.50">
            <Tabs colorScheme="brand" variant="soft-rounded">
              <TabList mb={4}>
                <Tab fontWeight={600}>📖 Voir les avis</Tab>
                <Tab fontWeight={600}>✍️ Laisser un avis</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <Box 
                    maxH="500px" 
                    overflowY="auto" 
                    css={{
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' },
                      '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '10px' },
                      '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
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

      {/* Desktop Add to Cart */}
      <Box 
        display={{ base: 'none', md: 'block' }} 
        mt={6}
        bg="white"
        p={6}
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor="gray.100"
      >
        <ProductCard
          id={String(product.id)}
          title={product.title || product.name}
          price={product.price ?? product.amount}
          image_url={product.image_url ?? product.product_image}
          images={product.images}
          quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
        />
      </Box>

      {/* Fullscreen Lightbox Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" boxShadow="none" maxW="100vw" p={0}>
          <ModalCloseButton 
            color="white" 
            bg="blackAlpha.700" 
            _hover={{ bg: 'blackAlpha.900' }} 
            size="lg" 
            borderRadius="full" 
            zIndex={10} 
            position="fixed" 
            top={4} 
            right={4} 
          />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
            <Box width="100%" display="flex" alignItems="center" justifyContent="center" position="relative" px={4}>
              {imgs.length > 1 && (
                <Box 
                  position="absolute" 
                  left={4} 
                  zIndex={5} 
                  onClick={(e) => { e.stopPropagation(); prev() }} 
                  cursor="pointer"
                >
                  <Box 
                    bg="blackAlpha.700" 
                    p={3} 
                    borderRadius="full"
                    transition="all 0.2s"
                    _hover={{ bg: 'blackAlpha.900', transform: 'scale(1.1)' }}
                  >
                    <Icon as={FaChevronLeft} boxSize={8} color="white" />
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
                  right={4} 
                  zIndex={5} 
                  onClick={(e) => { e.stopPropagation(); next() }} 
                  cursor="pointer"
                >
                  <Box 
                    bg="blackAlpha.700" 
                    p={3} 
                    borderRadius="full"
                    transition="all 0.2s"
                    _hover={{ bg: 'blackAlpha.900', transform: 'scale(1.1)' }}
                  >
                    <Icon as={FaChevronRight} boxSize={8} color="white" />
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