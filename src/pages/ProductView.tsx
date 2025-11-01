import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Container, Heading, Box, Image, Text, Spinner, Center, Button, HStack, Icon, Badge, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { highRes, PRODUCT_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import BackButton from '../components/BackButton'

export default function ProductView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [imageIndex, setImageIndex] = React.useState(0)
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
    <Container maxW="container.md" py={8}>
      <Center><Spinner /></Center>
    </Container>
  )

  if (!product) return (
    <Container maxW="container.md" py={8}>
      <Box textAlign="center">
        <Heading size="lg">Produit introuvable</Heading>
        <Text mt={3}>Le produit demandé est introuvable ou a été supprimé.</Text>
        <Button mt={6} onClick={() => navigate(location.state?.from || '/products')}>Retour</Button>
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
    <Container maxW="container.md" py={8}>
      <BackButton to={location.state?.from} />
      <Heading mb={4}>{product.title || product.name}</Heading>
      <Box mb={4}>
        <Box position="relative" overflow="hidden" borderRadius="md" height={{ base: '300px', md: '420px' }} onClick={onImageOpen} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {imgs.length === 0 ? (
            <Image src={PRODUCT_PLACEHOLDER} alt="Produit" objectFit="cover" width="100%" height="100%" />
          ) : (
            <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
              {/* Prev */}
              {imgs.length > 1 && (
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={2}>
                  <Box bg="blackAlpha.500" p={2} borderRadius="full" onClick={(e) => { e.stopPropagation(); prev() }} cursor="pointer">
                    <Icon as={FaChevronLeft} color="white" boxSize={5} />
                  </Box>
                </Box>
              )}

              <Image key={imgs[imageIndex] ?? 'img'} src={currentSrc ?? PRODUCT_PLACEHOLDER} alt={product.title || product.name} objectFit="cover" width="100%" height="100%" transition="opacity 300ms ease" />

              {/* Next */}
              {imgs.length > 1 && (
                <Box position="absolute" right={3} top="50%" transform="translateY(-50%)" zIndex={2}>
                  <Box bg="blackAlpha.500" p={2} borderRadius="full" onClick={(e) => { e.stopPropagation(); next() }} cursor="pointer">
                    <Icon as={FaChevronRight} color="white" boxSize={5} />
                  </Box>
                </Box>
              )}

              {/* Counter */}
              {imgs.length > 1 && (
                <Badge position="absolute" bottom={3} right={3} colorScheme="blackAlpha" bg="blackAlpha.600" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
                  {imageIndex + 1} / {imgs.length}
                </Badge>
              )}
            </Box>
          )}
        </Box>
        {/* Thumbnails */}
        {imgs.length > 1 && (
          <SimpleGrid columns={{ base: 4, md: 6 }} spacing={2} mt={3}>
            {imgs.map((src: string, idx: number) => (
              <Box key={idx} border={idx === imageIndex ? '2px solid' : '1px solid'} borderColor={idx === imageIndex ? 'brand.500' : 'gray.200'} borderRadius="md" overflow="hidden" cursor="pointer" onClick={() => setImageIndex(idx)}>
                <Image src={highRes(src, { width: 400 }) ?? src} alt={`Vignette ${idx+1}`} objectFit="cover" width="100%" height="60px" />
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
      <Box mb={4}>
        <Text fontSize="xl" fontWeight="700">{Math.floor(product.price)} FCFA</Text>
      </Box>
      {/* Stock detail */}
      <Box mb={4}>
        {typeof product.quantity !== 'undefined' && product.quantity !== null ? (
          product.quantity > 0 ? (
            <Text color="green.600" fontWeight="600">En stock : {product.quantity} unité(s) disponibles</Text>
          ) : (
            <Text color="red.500" fontWeight="700">Rupture de stock</Text>
          )
        ) : null}
      </Box>
      <Box mb={6}>
        <Text>{product.description}</Text>
      </Box>

      <ProductCard
        id={String(product.id)}
        title={product.title || product.name}
        price={product.price ?? product.amount}
        image_url={product.image_url ?? product.product_image}
        images={product.images}
        quantity={product.quantity ?? product.quantite ?? product.stock ?? product.amount_available}
      />

      {/* Fullscreen lightbox modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" boxShadow="none" maxW="100vw" p={0}>
          <ModalCloseButton color="white" bg="blackAlpha.600" _hover={{ bg: 'blackAlpha.800' }} size="lg" borderRadius="full" zIndex={1} position="fixed" top={4} right={4} />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
            <Box width="100%" display="flex" alignItems="center" justifyContent="center" position="relative" px={4}>
              {imgs.length > 1 && (
                <Box position="absolute" left={4} zIndex={2} onClick={(e) => { e.stopPropagation(); prev() }} cursor="pointer" aria-hidden>
                  <Box bg="blackAlpha.500" p={2} borderRadius="full"><Icon as={FaChevronLeft} boxSize={6} color="white" /></Box>
                </Box>
              )}

              <Image src={highRes(imgs[imageIndex] ?? imgs[0], { width: 1200, quality: 80 }) ?? (imgs[imageIndex] ?? imgs[0])} alt={product.title || product.name} objectFit="contain" maxH="95vh" />

              {imgs.length > 1 && (
                <Box position="absolute" right={4} zIndex={2} onClick={(e) => { e.stopPropagation(); next() }} cursor="pointer" aria-hidden>
                  <Box bg="blackAlpha.500" p={2} borderRadius="full"><Icon as={FaChevronRight} boxSize={6} color="white" /></Box>
                </Box>
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
