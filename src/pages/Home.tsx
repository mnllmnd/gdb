import React from 'react'
import {
  Heading,
  Text,
  Container,
  Button,
  Spinner,
  VStack,
  Box,
  Image,
  Center,
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
  ScaleFade,
  SimpleGrid,
  Icon,
  Card,
  CardBody,
  Fade,
} from '@chakra-ui/react'
import { CloseIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { FiPackage } from 'react-icons/fi'
import FilterNav from '../components/FilterNav'
import AppTutorial from '../components/AppTutorial'
import HeroNike from '../components/HeroNike'
import HeroProductStrip from '../components/HeroProductStrip'
import { Link as RouterLink, useLocation, useNavigationType } from 'react-router-dom'
import { usePageState } from '../components/ScrollRestoration'
import api from '../services/api'

interface Product {
  id: number
  title?: string
  name?: string
  description?: string
  price?: number
  amount?: number
  category_id?: number | null
  image_url?: string
  product_image?: string
  images?: string[] | any
  [key: string]: string | number | null | undefined | string[] | any
}

interface Category {
  id: number
  name: string
}

// Fonction utilitaire pour normaliser les images
const normalizeImages = (product: Product): string[] => {
  if (Array.isArray(product.images)) {
    return product.images.filter((img): img is string => typeof img === 'string' && img.trim() !== '')
  }
  
  const mainImage = product.image_url ?? product.product_image
  if (mainImage && typeof mainImage === 'string' && mainImage.trim() !== '') {
    return [mainImage]
  }
  
  return []
}

// Fonction pour formater les prix en F
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ' F'
}

// Welcome Popup Component
function WelcomePopup() {
  const [isOpen, setIsOpen] = React.useState(true)
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const brandBg = useColorModeValue('brand.50', 'gray.900')
  const subTextColor = useColorModeValue('gray.600', 'gray.400')
  
  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('welcomeDismissed', 'true')
  }

  if (!isOpen) return null

  return (
    <ScaleFade initialScale={0.9} in={isOpen}>
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        onClick={handleClose}
      >
        <Card
          maxW="md"
          bg={bgColor}
          onClick={(e) => e.stopPropagation()}
          borderRadius="lg"
          boxShadow="2xl"
        >
          <CardBody p={8}>
            <VStack spacing={6} textAlign="center">
              <Box
                p={6}
                bg={brandBg}
                borderRadius="full"
              >
                <Icon as={FiPackage} boxSize={12} color="brand.500" />
              </Box>
              <VStack spacing={2}>
                <Heading size="lg" color={textColor}>
                  Bienvenue!
                </Heading>
                <Text color={subTextColor}>
                  Vendre ou acheter, yay choisir
                </Text>
              </VStack>
              <Button
                colorScheme="brand"
                size="lg"
                w="full"
                onClick={handleClose}
                borderRadius="md"
              >
                Commencer
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </ScaleFade>
  )
}

// Empty State Component
interface EmptyStateProps {
  message: string
  onClear: () => void
}

function EmptyState({ message, onClear }: EmptyStateProps) {
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.900')
  const containerBg = useColorModeValue('gray.100', 'gray.900')
  const containerBorder = useColorModeValue('gray.300', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.900')
  const iconColor = useColorModeValue('gray.400', 'gray.500')
  const subTextColor = useColorModeValue('gray.600', 'gray.400')
  
  return (
    <Center py={16}>
      <Card
        maxW="md"
        bg={bgColor}
        borderRadius="md"
        boxShadow="sm"
        border="1px solid"
        borderColor={borderColor}
      >
        <CardBody p={8}>
          <VStack spacing={4} textAlign="center">
            <Box
              p={4}
              bg={containerBg}
              borderRadius="full"
              border="1px solid"
              borderColor={containerBorder}
            >
              <Icon as={FiPackage} boxSize={10} color={iconColor} />
            </Box>
            <VStack spacing={1.5}>
              <Heading size="md" color={textColor} fontWeight="600">
                {message}
              </Heading>
              <Text color={subTextColor} fontSize="sm">
                Modifiez vos critères de recherche
              </Text>
            </VStack>
            <Button
              colorScheme="brand"
              size="md"
              borderRadius="md"
              onClick={onClear}
              rightIcon={<CloseIcon />}
              fontWeight="500"
              fontSize="sm"
            >
              Réinitialiser
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Center>
  )
}

// Pinterest-style Product Card (sans carte blanche)
function PinterestProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = React.useState(false)
  const textColor = useColorModeValue('#111', '#fff')
  const images = normalizeImages(product)

  return (
    <RouterLink to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <Box
        transition="all 0.2s ease"
        _hover={{ transform: 'translateY(-2px)' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        mb={4}
        cursor="pointer"
      >
        {/* Image seule avec coins arrondis */}
        <Box 
          position="relative" 
          overflow="hidden"
          borderRadius="16px"
          boxShadow={isHovered ? 'lg' : 'sm'}
          transition="box-shadow 0.2s ease"
        >
          {images[0] ? (
            <Image
              src={images[0]}
              alt={String(product.title || product.name)}
              w="100%"
              h="auto"
              objectFit="cover"
              transition="transform 0.3s ease"
              transform={isHovered ? 'scale(1.02)' : 'scale(1)'}
            />
          ) : (
            <Box
              w="100%"
              paddingBottom="120%"
              bg={useColorModeValue('gray.200', 'gray.800')}
              position="relative"
            >
              <Center position="absolute" inset={0}>
                <Icon as={FiPackage} boxSize={12} color="gray.400" />
              </Center>
            </Box>
          )}
          
          {/* Overlay "VOIR DÉTAILS" au hover */}
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.700"
            opacity={isHovered ? 1 : 0}
            transition="opacity 0.25s ease"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text 
              color="white" 
              fontSize="sm" 
              fontWeight="600" 
              letterSpacing="wide"
              textTransform="uppercase"
            >
              Voir détails
            </Text>
          </Box>

          {/* Badge stock */}
          {product.amount && product.amount > 0 && (
            <Badge
              position="absolute"
              top={2}
              left={2}
              colorScheme="green"
              fontSize="2xs"
              borderRadius="md"
              px={2}
              py={0.5}
            >
              {product.amount}
            </Badge>
          )}

          {/* Bouton trois points au hover */}
          {isHovered && (
            <IconButton
              aria-label="Options"
              icon={<Text fontSize="lg" fontWeight="bold">•••</Text>}
              position="absolute"
              top={2}
              right={2}
              size="sm"
              borderRadius="full"
              bg="white"
              color="black"
              _hover={{ bg: 'gray.100' }}
              boxShadow="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
          )}
        </Box>

        {/* Texte en dessous (centré) */}
        <Box pt={2} px={1} textAlign="center">
          <Heading
            as="h3"
            fontSize="sm"
            fontWeight="600"
            color={textColor}
            noOfLines={2}
            mb={1}
            lineHeight="1.3"
          >
            {product.title || product.name || 'Sans titre'}
          </Heading>
          
          {product.price && (
            <Text
              fontSize="md"
              fontWeight="700"
              color={textColor}
            >
              {formatPrice(product.price)}
            </Text>
          )}
        </Box>
      </Box>
    </RouterLink>
  )
}

export default function Home() {
  const { save, restore } = usePageState()
  const location = useLocation()
  const navigationType = useNavigationType()
  
  const bgColor = useColorModeValue('#f5f5f5', '#0a0a0a')
  
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showScrollTop, setShowScrollTop] = React.useState(false)
  
  const [welcomeDismissed] = React.useState(() => {
    try {
      return localStorage.getItem('welcomeDismissed') === 'true'
    } catch {
      return false
    }
  })
  
  // Load data on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [categoriesData, productsData] = await Promise.all([
          api.categories.list(),
          api.products.list(),
        ])

        setCategories(categoriesData || [])
        setProducts(productsData || [])
      } catch (error) {
        console.error('[Home] Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle scroll
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Restore scroll position
  React.useEffect(() => {
    if (navigationType === 'POP') {
      const savedState = restore()
      if (savedState?.scrollPosition > 0) {
        window.scrollTo(0, savedState.scrollPosition)
      }
    }
  }, [navigationType, restore])

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    save({ scrollPosition: 0 })
  }

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    save({ scrollPosition: 0 })
  }

  return (
    <Box bg={bgColor} minH="100vh">
      {!welcomeDismissed && <WelcomePopup />}
      
      <HeroNike />
      <HeroProductStrip />
      
      <AppTutorial />

      <Container maxW="container.xl" py={3}>
        <FilterNav 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {isLoading ? (
          <Center py={16}>
            <Spinner size="lg" color="brand.500" />
          </Center>
        ) : filteredProducts.length === 0 ? (
          <EmptyState 
            message="Aucun produit trouvé"
            onClear={() => handleCategoryChange(null)}
          />
        ) : (
          <Box px={{ base: 2, md: 0 }} py={6}>
            <SimpleGrid
              columns={{ base: 2, md: 3, lg: 4, xl: 5 }}
              spacing={{ base: 3, md: 4 }}
            >
              {filteredProducts.map((product) => (
                <ScaleFade key={product.id} initialScale={0.9} in={true}>
                  <PinterestProductCard product={product} />
                </ScaleFade>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Container>

      {showScrollTop && (
        <Fade in={showScrollTop}>
          <IconButton
            icon={<ArrowUpIcon />}
            isRound
            colorScheme="brand"
            position="fixed"
            bottom={8}
            right={8}
            onClick={handleScrollTop}
            aria-label="Scroll to top"
            size="lg"
            boxShadow="lg"
            zIndex={100}
          />
        </Fade>
      )}
    </Box>
  )
}