import React from 'react'
import {
  Box,
  Image,
  VStack,
  Text,
  Heading,
  Badge,
  HStack,
  IconButton,
  useColorModeValue,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Flex,
  Divider,
  Stack,
  AspectRatio,
} from '@chakra-ui/react'
import { FiHeart, FiShoppingCart, FiPackage, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface Props {
  id?: string
  title?: string
  description?: string
  price?: number | string | null
  image?: string
  image_url?: string
  images?: string[]
  quantity?: number | null
  height?: string | number
  shopName?: string
  shopDomain?: string
  onLike?: () => void
  onAddToCart?: () => void
}

/**
 * Carte produit minimaliste ultra-élégante avec modal détaillé
 */
const ProductCardMinimal: React.FC<Props> = ({
  id,
  title,
  description,
  price,
  image,
  image_url,
  images,
  quantity,
  height = '280px',
  shopName,
  shopDomain,
  onLike,
  onAddToCart,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bg = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.900')
  const modalBg = useColorModeValue('white', 'gray.900')
  
  // Normalisation des images
  const allImages = React.useMemo(() => {
    const imageList: string[] = []
    if (images && Array.isArray(images)) {
      imageList.push(...images.filter(img => typeof img === 'string' && img.trim()))
    }
    if (image_url && typeof image_url === 'string') imageList.push(image_url)
    if (image && typeof image === 'string') imageList.push(image)
    return imageList.length > 0 ? imageList : ['/img/b.jfif']
  }, [images, image_url, image])

  const mainImage = allImages[0]
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [hovered, setHovered] = React.useState(false)
  const [liked, setLiked] = React.useState(false)

  const isOutOfStock = quantity !== null && quantity !== undefined && quantity === 0
  const isLowStock = quantity !== null && quantity !== undefined && quantity > 0 && quantity < 5

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(!liked)
    onLike?.()
  }

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onAddToCart?.()
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <>
      {/* Carte Produit */}
      <Box
        bg={bg}
        borderRadius="3xl"
        overflow="hidden"
        border="1px solid"
        borderColor={borderColor}
        cursor="pointer"
        position="relative"
        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{ 
          transform: 'translateY(-12px) scale(1.02)', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderColor: 'brand.300',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onOpen}
        h="100%"
        display="flex"
        flexDirection="column"
      >
        {/* Image Container */}
        <Box position="relative" h={height} w="100%" overflow="hidden" bg="gray.100">
          <Image
            src={mainImage}
            alt={title || 'product'}
            objectFit="cover"
            w="100%"
            h="100%"
            transition="all 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hovered ? 'scale(1.15) rotate(2deg)' : 'scale(1)'}
            filter={isOutOfStock ? 'grayscale(80%) opacity(0.6)' : 'none'}
          />

          {/* Overlay gradient subtil */}
          <Box
            position="absolute"
            inset="0"
            bgGradient="linear(to-t, blackAlpha.400, transparent 40%)"
            opacity={hovered ? 1 : 0.7}
            transition="opacity 0.4s"
          />

          {/* Badges en haut */}
          <HStack position="absolute" top="4" left="4" right="4" justify="space-between">
            {isOutOfStock ? (
              <Badge
                colorScheme="red"
                fontSize="xs"
                px="3"
                py="1.5"
                borderRadius="full"
                fontWeight="bold"
                textTransform="uppercase"
                boxShadow="lg"
                backdropFilter="blur(10px)"
                bg="red.500"
                color="white"
              >
                Épuisé
              </Badge>
            ) : isLowStock ? (
              <Badge
                colorScheme="orange"
                fontSize="xs"
                px="3"
                py="1.5"
                borderRadius="full"
                fontWeight="bold"
                boxShadow="lg"
                backdropFilter="blur(10px)"
                bg="orange.400"
                color="white"
              >
                {quantity} restant{(quantity || 0) > 1 ? 's' : ''}
              </Badge>
            ) : <Box />}

            {/* Bouton Like */}
            <Box
              opacity={hovered ? 1 : 0}
              transform={hovered ? 'scale(1) rotate(0)' : 'scale(0.5) rotate(-90deg)'}
              transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
            >
              <IconButton
                aria-label="Like"
                icon={<FiHeart fill={liked ? 'currentColor' : 'none'} />}
                size="md"
                colorScheme={liked ? 'red' : 'whiteAlpha'}
                variant="solid"
                borderRadius="full"
                onClick={handleLike}
                boxShadow="xl"
                backdropFilter="blur(10px)"
                _hover={{ transform: 'scale(1.2)' }}
              />
            </Box>
          </HStack>

          {/* Prix en bas (toujours visible) */}
          <Box
            position="absolute"
            bottom="4"
            left="4"
            right="4"
          >
            <HStack justify="space-between" align="flex-end">
              {price != null && (
                <Badge
                  fontSize="lg"
                  px="4"
                  py="2"
                  borderRadius="full"
                  fontWeight="extrabold"
                  bg="whiteAlpha.900"
                  color="green.600"
                  boxShadow="xl"
                  backdropFilter="blur(10px)"
                >
                  {typeof price === 'number' ? `${price.toLocaleString()} FCFA` : price}
                </Badge>
              )}
              
              {/* Icône panier au hover */}
              {!isOutOfStock && (
                <Box
                  opacity={hovered ? 1 : 0}
                  transform={hovered ? 'translateX(0)' : 'translateX(20px)'}
                  transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  transitionDelay="0.1s"
                >
                  <IconButton
                    aria-label="Voir détails"
                    icon={<FiShoppingCart />}
                    size="lg"
                    colorScheme="brand"
                    borderRadius="full"
                    boxShadow="2xl"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpen()
                    }}
                    _hover={{ transform: 'scale(1.15)' }}
                  />
                </Box>
              )}
            </HStack>
          </Box>
        </Box>

        {/* Info en bas */}
        <VStack 
          align="stretch" 
          p="4" 
          spacing="2" 
          flex="1"
          bg={hovered ? hoverBg : 'transparent'}
          transition="background 0.3s"
        >
          <Text 
            fontSize="md" 
            color={textColor} 
            fontWeight="bold" 
            noOfLines={2}
            lineHeight="1.3"
          >
            {title || 'Produit sans titre'}
          </Text>
          
          {shopName && (
            <HStack spacing={2} opacity={0.7}>
              <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                {shopName}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Modal Détails Produit */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent bg={modalBg} borderRadius="3xl" overflow="hidden" maxH="90vh">
          <ModalCloseButton zIndex="10" size="lg" borderRadius="full" />
          
          <ModalBody p={0}>
            <Flex direction={{ base: 'column', md: 'row' }} minH="500px">
              {/* Galerie d'images */}
              <Box flex="1" position="relative" bg="gray.100" minH={{ base: '300px', md: '500px' }}>
                <AspectRatio ratio={1} w="100%" h="100%">
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={title}
                    objectFit="cover"
                  />
                </AspectRatio>

                {/* Navigation images */}
                {allImages.length > 1 && (
                  <>
                    <IconButton
                      aria-label="Image précédente"
                      icon={<FiChevronLeft />}
                      position="absolute"
                      left="4"
                      top="50%"
                      transform="translateY(-50%)"
                      borderRadius="full"
                      colorScheme="whiteAlpha"
                      onClick={(e) => {
                        e.stopPropagation()
                        prevImage()
                      }}
                    />
                    <IconButton
                      aria-label="Image suivante"
                      icon={<FiChevronRight />}
                      position="absolute"
                      right="4"
                      top="50%"
                      transform="translateY(-50%)"
                      borderRadius="full"
                      colorScheme="whiteAlpha"
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                    />
                    
                    {/* Indicateurs */}
                    <HStack position="absolute" bottom="4" left="50%" transform="translateX(-50%)" spacing={2}>
                      {allImages.map((_, idx) => (
                        <Box
                          key={idx}
                          w={currentImageIndex === idx ? "8" : "2"}
                          h="2"
                          bg={currentImageIndex === idx ? "white" : "whiteAlpha.600"}
                          borderRadius="full"
                          transition="all 0.3s"
                          cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImageIndex(idx)
                          }}
                        />
                      ))}
                    </HStack>
                  </>
                )}
              </Box>

              {/* Détails produit */}
              <VStack flex="1" p={8} align="stretch" spacing={6} overflowY="auto">
                {/* En-tête */}
                <VStack align="stretch" spacing={3}>
                  <Heading size="lg" color={textColor}>
                    {title}
                  </Heading>
                  
                  {shopName && (
                    <HStack spacing={2} color="brand.500">
                      <Text fontSize="md" fontWeight="semibold">
                        {shopName}
                      </Text>
                    </HStack>
                  )}
                </VStack>

                <Divider />

                {/* Prix et Stock */}
                <Stack spacing={4}>
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      Prix
                    </Text>
                    <Heading size="xl" color="green.500">
                      {typeof price === 'number' ? `${price.toLocaleString()} FCFA` : price || 'N/A'}
                    </Heading>
                  </HStack>

                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      Disponibilité
                    </Text>
                    <HStack>
                      <FiPackage />
                      {isOutOfStock ? (
                        <Badge colorScheme="red" fontSize="md" px="3" py="1">Rupture de stock</Badge>
                      ) : isLowStock ? (
                        <Badge colorScheme="orange" fontSize="md" px="3" py="1">{quantity} en stock</Badge>
                      ) : (
                        <Badge colorScheme="green" fontSize="md" px="3" py="1">En stock</Badge>
                      )}
                    </HStack>
                  </HStack>
                </Stack>

                <Divider />

                {/* Description */}
                {description && (
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600">
                      Description
                    </Text>
                    <Text fontSize="sm" color={textColor} lineHeight="1.7">
                      {description}
                    </Text>
                  </VStack>
                )}

                {/* Actions */}
                <Stack spacing={3} pt={4}>
                  <Button
                    size="lg"
                    colorScheme="brand"
                    leftIcon={<FiShoppingCart />}
                    onClick={handleAddToCart}
                    isDisabled={isOutOfStock}
                    borderRadius="full"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                  >
                    {isOutOfStock ? 'Produit épuisé' : 'Ajouter au panier'}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    colorScheme="gray"
                    leftIcon={<FiHeart fill={liked ? 'currentColor' : 'none'} />}
                    onClick={(e) => handleLike(e)}
                    borderRadius="full"
                  >
                    {liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </Button>
                </Stack>
              </VStack>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ProductCardMinimal