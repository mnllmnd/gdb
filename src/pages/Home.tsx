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

// ✅ Fonction utilitaire pour normaliser les images
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

// ✅ Fonction pour formater les prix en F
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ' F'
}

// Welcome Popup Component
function WelcomePopup() {
  // 1. Tous les hooks au début, avant toute condition
  const [isOpen, setIsOpen] = React.useState(true)
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const brandBg = useColorModeValue('brand.50', 'gray.900')
  const subTextColor = useColorModeValue('gray.600', 'gray.400')
  
  // 2. Ensuite seulement, la logique conditionnelle
  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('welcomeDismissed', 'true')
  }

  // 3. Retour conditionnel APRÈS tous les hooks
  if (!isOpen) return null

  return (
    <ScaleFade initialScale={0.9} in={isOpen}>
      <Box
        position="fixed"
        inset={0}
        bg="gray.900Alpha.500"
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
                  Découvrez nos meilleurs produits
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
  // Tous les hooks au début
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.900')
  const containerBg = useColorModeValue('gray.100', 'gray.900')
  const containerBorder = useColorModeValue('gray.300', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.900')
  const iconColor = useColorModeValue('gray.400', 'gray.500')
  const subTextColor = useColorModeValue('gray.600', 'gray.400')
  
  // Pas de hooks après ce point
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

export default function Home() {
  // 1. Tous les hooks au début, dans un ordre fixe
  const { save, restore } = usePageState()
  const location = useLocation()
  const navigationType = useNavigationType()
  
  const bgColor = useColorModeValue('white', 'gray.900')
  const cardBgColor = useColorModeValue('white', 'gray.900')
  const productCardBg = useColorModeValue('gray.100', 'gray.900')
  const titleColor = useColorModeValue('gray.700', 'gray.300')
  const descriptionColor = useColorModeValue('gray.500', 'gray.400')
  const iconColor = useColorModeValue('gray.300', 'gray.600')
  
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showScrollTop, setShowScrollTop] = React.useState(false)
  
  const [currentUser] = React.useState(() => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  
  const [welcomeDismissed] = React.useState(() => {
    try {
      return localStorage.getItem('welcomeDismissed') === 'true'
    } catch {
      return false
    }
  })
  
  // 2. Les useEffect viennent APRÈS tous les useState/useContext
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

  // 3. Maintenant seulement le JSX conditionnel
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
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={6}
            py={8}
          >
            {filteredProducts.map((product) => (
              <ScaleFade key={product.id} initialScale={0.9} in={true}>
                <RouterLink to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                  <Box
                    borderRadius="lg"
                    overflow="hidden"
                    bg={cardBgColor}
                    boxShadow="sm"
                    _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    {/* Product Image */}
                    <Box position="relative" w="100%" paddingBottom="100%" bg={productCardBg}>
                      {normalizeImages(product)[0] ? (
                        <Image
                          src={normalizeImages(product)[0]}
                          alt={product.title || product.name || 'Product'}
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      ) : (
                        <Center h="100%">
                          <Icon as={FiPackage} boxSize={12} color={iconColor} />
                        </Center>
                      )}
                    </Box>

                    {/* Product Info */}
                    <Box p={4}>
                      <Text
                        fontSize="sm"
                        fontWeight="500"
                        noOfLines={2}
                        mb={2}
                        color={titleColor}
                      >
                        {product.title || product.name || 'Sans titre'}
                      </Text>

                      {product.description && (
                        <Text
                          fontSize="xs"
                          color={descriptionColor}
                          noOfLines={1}
                          mb={3}
                        >
                          {product.description}
                        </Text>
                      )}

                      <HStack justify="space-between">
                        <Heading size="sm" color="brand.500">
                          {product.price ? formatPrice(product.price) : 'N/A'}
                        </Heading>
                        {product.amount && product.amount > 0 && (
                          <Badge colorScheme="green" fontSize="xs">
                            {product.amount} en stock
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  </Box>
                </RouterLink>
              </ScaleFade>
            ))}
          </SimpleGrid>
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
          />
        </Fade>
      )}
    </Box>
  )
}