import React, { useState, useEffect } from 'react'
import {
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  NumberInput,
  NumberInputField,
  Textarea,
  Image,
  Box,
  Select,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  Icon,
  Flex,
  Progress,
  AspectRatio,
  useToast,
  useBreakpointValue,
} from '@chakra-ui/react'
import { FiUpload, FiImage, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import BackButton from '../components/BackButton'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getItem } from '../utils/localAuth'

export default function ProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined)
  const [discount, setDiscount] = useState<number>(0)
  const [quantity, setQuantity] = useState<number | undefined>(0)
  const [images, setImages] = useState<Array<{ file?: File; url: string }>>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true)
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()

  const canSubmit = (() => {
    if (loading) return false
    if (!title || String(title).trim().length === 0) return false
    if (!Number.isFinite(Number(price))) return false
    if (!selectedCategory) return false
    return true
  })()

  const bgForm = useColorModeValue('white', 'black')
  const bgPage = useColorModeValue('black', 'white')
  const labelColor = useColorModeValue('gray.700', 'gray.200')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBorderColor = useColorModeValue('blue.400', 'blue.300')

  // Responsive values
  const containerPadding = useBreakpointValue({ base: 4, sm: 6, md: 10 })
  const formPadding = useBreakpointValue({ base: 4, sm: 6, md: 8 })
  const imageSize = useBreakpointValue({ base: '80px', sm: '100px', md: '120px' })
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'lg' })
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' })

  useEffect(() => {
    let mounted = true
    setCategoriesLoading(true)
    api.categories.list()
      .then((cats) => { if (!mounted) return; setCategories(Array.isArray(cats) ? cats : []) })
      .catch((err) => { console.error('Failed to load categories', err); if (mounted) setCategories([]) })
      .finally(() => { if (mounted) setCategoriesLoading(false) })

    if (!id) return
    api.products.list()
      .then((list: any[]) => {
        const p = list.find((x) => String(x.id) === String(id))
        if (p) {
          setTitle(p.title)
          setDescription(p.description || '')
          setPrice(p.price)
          setOriginalPrice(p.original_price || p.price)
          setDiscount(p.discount || 0)
          setImages(p.images?.length ? p.images.map((u: string) => ({ url: u })) : (p.image_url ? [{ url: p.image_url }] : (p.image ? [{ url: p.image }] : [])))
          setSelectedCategory(p.category_id)
          setQuantity(typeof p.quantity !== 'undefined' && p.quantity !== null ? Number(p.quantity) : 0)
        }
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (id) return
    // Allow any authenticated user to create a product without forcing shop creation.
    // If user is not logged in redirect to login.
    const token = getItem('token')
    if (!token) {
      // preserve desired destination after login
      try { localStorage.setItem('afterLogin', '/seller/product') } catch {}
      window.location.href = '/login'
    }
  }, [id])

  const handleFileSelect = (selectedFiles: File[] | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return
    // append to existing images, cap at 12 images to avoid abuse
    const allowed = selectedFiles.filter(f => f.type && f.type.startsWith('image/')).slice(0, 12 - images.length)
    if (allowed.length === 0) return
    const items = allowed.map(f => ({ file: f as File, url: URL.createObjectURL(f as File) }))
    setImages(prev => [...prev, ...items])
    setUploadProgress(0)

    // lightweight fake progress while uploads occur later
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 100)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    const imgs = droppedFiles.filter(f => f.type && f.type.startsWith('image/'))
    if (imgs.length > 0) {
      handleFileSelect(imgs)
    } else {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez sélectionner une image (JPG, PNG, etc.)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleClickUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length) {
        handleFileSelect(Array.from(target.files))
      }
    }
    input.click()
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setUploadProgress(0)
  }

  const moveImage = (from: number, to: number) => {
    if (from === to) return
    setImages(prev => {
      const arr = [...prev]
      if (from < 0 || from >= arr.length || to < 0 || to > arr.length) return arr
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    // Simulation de fin d'upload
    setUploadProgress(100)
    
    try {
      const token = getItem('token')
      let image_url: string | undefined
      let imagesPayload: string[] | undefined

      // Build the final ordered images list by uploading local files and keeping remote URLs
      if (images && images.length > 0) {
        const results = await Promise.all(images.map(async (it) => {
          if (it.file) {
            const upl = await api.uploads.uploadFile(it.file, token ?? undefined)
            return upl?.url
          }
          return it.url
        }))
        imagesPayload = results.filter(Boolean) as string[]
        if (imagesPayload.length > 0) image_url = imagesPayload[0]
      }

      if (!selectedCategory) {
        toast({
          title: 'Catégorie manquante',
          description: 'Veuillez sélectionner une catégorie',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        setLoading(false)
        return
      }

      const payload: any = {
        title,
        description,
        price: typeof price === 'number' ? price : (price ? Number(price) : null),
        original_price: typeof originalPrice === 'number' ? originalPrice : (originalPrice ? Number(originalPrice) : price),
        discount: typeof discount === 'number' ? discount : 0,
        category_id: selectedCategory,
      }
      // include quantity if provided
      if (typeof quantity !== 'undefined' && quantity !== null) payload.quantity = Number(quantity)
      if (image_url) payload.image_url = image_url
      if (imagesPayload && imagesPayload.length) payload.images = imagesPayload

      if (id) {
        await api.products.update(id, payload, token ?? undefined)
        toast({
          title: 'Produit modifié',
          description: 'Votre produit a été mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        const created = await api.products.create(payload, token ?? undefined)
        toast({
          title: 'Produit créé',
          description: 'Votre produit a été ajouté avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        try {
          if (created && created.id) navigate(`/products/${created.id}`)
          else navigate('/products')
        } catch (e) { navigate('/products') }
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erreur',
        description: err?.error || 'Une erreur est survenue lors de l\'enregistrement',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Container 
      maxW="container.sm" 
      py={containerPadding} 
      pb={{ base: '120px', md: 10 }} 
      overflow="visible"
      px={4}
    >
      <BackButton />
      <Heading 
        mb={6} 
        textAlign="center" 
        fontSize={headingSize}
        bgGradient="linear(to-r, blue.400, blue.600)"
        bgClip="text"
        fontWeight="700"
        px={2}
      >
        {id ? 'Modifier le produit' : 'Ajouter un produit'}
      </Heading>

      <Box
        bg={bgForm}
        p={formPadding}
        borderRadius="2xl"
        boxShadow="0 8px 32px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Stack spacing={6} as="form" onSubmit={handleSubmit}>
          <FormControl isRequired>
            <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
              Nom du produit
            </FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Tasse en céramique artisanale"
              bg="white"
              color="gray.800"
              borderRadius="lg"
              border="2px solid"
              borderColor={borderColor}
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500'
              }}
              size="lg"
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
              Description
            </FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre produit en détail..."
              bg="white"
              color="gray.800"
              borderRadius="lg"
              border="2px solid"
              borderColor={borderColor}
              _hover={{ borderColor: 'gray.300' }}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500'
              }}
              minH="120px"
              resize="vertical"
            />
          </FormControl>

          {/* Grid pour les champs de prix sur mobile */}
          <Flex 
            direction={{ base: 'column', sm: 'row' }} 
            gap={{ base: 4, sm: 3 }}
            wrap="wrap"
          >
            <FormControl flex={{ base: '1', sm: '1' }} minW={{ base: '100%', sm: '140px' }}>
              <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
                Prix original (FCFA)
              </FormLabel>
              <NumberInput 
                min={0} 
                precision={0} 
                value={originalPrice} 
                onChange={(v) => setOriginalPrice(Number(v) || undefined)}
              >
                <NumberInputField
                  bg="white"
                  color="gray.800"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500'
                  }}
                  placeholder="Prix avant réduction"
                />
              </NumberInput>
            </FormControl>

            <FormControl flex={{ base: '1', sm: '0.8' }} minW={{ base: '100%', sm: '110px' }}>
              <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
                Réduction (%)
              </FormLabel>
              <NumberInput 
                min={0} 
                max={100}
                precision={0} 
                value={discount} 
                onChange={(v) => {
                  const val = Number(v) || 0
                  setDiscount(Math.min(100, Math.max(0, val)))
                  if (originalPrice && val > 0) {
                    // Calculer automatiquement le nouveau prix avec la réduction
                    const discountedPrice = originalPrice * (1 - val / 100)
                    setPrice(Math.round(discountedPrice))
                  }
                }}
              >
                <NumberInputField
                  bg="white"
                  color="gray.800"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500'
                  }}
                  placeholder="0"
                />
              </NumberInput>
            </FormControl>

            <FormControl flex={{ base: '1', sm: '1' }} minW={{ base: '100%', sm: '140px' }}>
              <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
                Prix final (FCFA)
              </FormLabel>
              <NumberInput 
                min={0} 
                precision={0} 
                value={price} 
                onChange={(v) => setPrice(Number(v) || 0)}
              >
                <NumberInputField
                  bg="white"
                  color="gray.800"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500'
                  }}
                  placeholder="5000"
                />
              </NumberInput>
            </FormControl>
          </Flex>

          <Flex 
            direction={{ base: 'column', sm: 'row' }} 
            gap={{ base: 4, sm: 3 }}
            wrap="wrap"
          >
            <FormControl flex={{ base: '1', sm: '1' }} minW={{ base: '100%', sm: '160px' }}>
              <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
                Quantité disponible
              </FormLabel>
              <NumberInput min={0} value={quantity} onChange={(v) => setQuantity(Number(v) || 0)}>
                <NumberInputField
                  bg="white"
                  color="gray.800"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500'
                  }}
                  placeholder="0"
                />
              </NumberInput>
            </FormControl>

            <FormControl isRequired flex={{ base: '1', sm: '2' }} minW={{ base: '100%', sm: '200px' }}>
              <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
                Catégorie
              </FormLabel>
              {categoriesLoading ? (
                <Box py={3} color="gray.500" fontSize="sm">Chargement des catégories...</Box>
              ) : categories.length === 0 ? (
                <Box py={3} color="red.500" fontSize="sm">Aucune catégorie disponible. Veuillez réessayer plus tard.</Box>
              ) : (
                <Select
                  placeholder="Choisissez une catégorie"
                  value={selectedCategory ? String(selectedCategory) : ''}
                  onChange={(e) => setSelectedCategory(Number(e.target.value))}
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={borderColor}
                  size="lg"
                >
                  {categories.map((cat) => (
                    <option key={String(cat.id)} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>
          </Flex>

          <FormControl>
            <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={3}>
              Images du produit
            </FormLabel>

            {images.length === 0 ? (
              <Box
                border="2px dashed"
                borderColor={isDragging ? 'blue.400' : borderColor}
                borderRadius="xl"
                p={6}
                textAlign="center"
                cursor="pointer"
                transition="all 0.3s ease"
                bg={isDragging ? 'blue.50' : 'gray.50'}
                _hover={{
                  bg: 'blue.50',
                  borderColor: hoverBorderColor,
                  transform: 'translateY(-2px)',
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClickUpload}
              >
                <VStack spacing={4}>
                  <Icon as={FiUpload} boxSize={8} color="gray.400" />
                  <Box>
                    <Text fontWeight="600" color="gray.700" mb={1} fontSize="sm">
                      Cliquez pour uploader ou glissez-déposez
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      PNG, JPG, WEBP jusqu'à 10 MB (max 12 images)
                    </Text>
                  </Box>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    leftIcon={<FiImage />}
                    onClick={(e) => { e.stopPropagation(); handleClickUpload() }}
                  >
                    Choisir des images
                  </Button>
                </VStack>
              </Box>
            ) : (
              <Box overflow="hidden">
                <Text fontSize="sm" color="gray.500" mb={3}>
                  {images.length} image(s) - Glissez pour réorganiser
                </Text>
                
                {/* Container scrollable pour les images */}
                <Box 
                  overflowX="auto" 
                  overflowY="visible"
                  pb={2}
                  sx={{
                    '&::-webkit-scrollbar': {
                      height: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'gray.100',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'gray.300',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: 'gray.400',
                    },
                  }}
                >
                  <Flex 
                    gap={3} 
                    minW="min-content"
                    wrap="nowrap"
                    pb={1}
                  >
                    {images.map((it, idx) => (
                      <Box 
                        key={idx} 
                        position="relative" 
                        width={imageSize}
                        flexShrink={0}
                        borderRadius="md" 
                        overflow="hidden" 
                        border="1px solid" 
                        borderColor={borderColor}
                        boxShadow="sm"
                      >
                        <AspectRatio ratio={4/3}>
                          <Image 
                            src={it.url} 
                            alt={`Image ${idx+1}`} 
                            objectFit="cover" 
                            w="100%"
                            h="100%"
                          />
                        </AspectRatio>
                        
                        {/* Boutons de contrôle */}
                        <Box position="absolute" top={1} right={1} display="flex" gap={1}>
                          <Icon 
                            as={FiX} 
                            boxSize={3} 
                            color="white" 
                            bg="red.500" 
                            borderRadius="full" 
                            p={1} 
                            cursor="pointer" 
                            onClick={() => removeImage(idx)}
                            fontSize="10px"
                          />
                        </Box>
                        
                        <Box position="absolute" left={1} bottom={1} display="flex" gap={1}>
                          <Icon 
                            as={FiChevronLeft} 
                            boxSize={3} 
                            color="white" 
                            bg="blackAlpha.700" 
                            borderRadius="full" 
                            p={1} 
                            cursor="pointer" 
                            onClick={() => moveImage(idx, Math.max(0, idx - 1))}
                            fontSize="10px"
                          />
                          <Icon 
                            as={FiChevronRight} 
                            boxSize={3} 
                            color="white" 
                            bg="blackAlpha.700" 
                            borderRadius="full" 
                            p={1} 
                            cursor="pointer" 
                            onClick={() => moveImage(idx, Math.min(images.length - 1, idx + 1))}
                            fontSize="10px"
                          />
                        </Box>
                      </Box>
                    ))}
                  </Flex>
                </Box>

                {/* Boutons d'action pour les images */}
                <Flex 
                  direction={{ base: 'column', sm: 'row' }} 
                  gap={3} 
                  mt={4}
                  wrap="wrap"
                >
                  <Button 
                    size="sm" 
                    variant="outline" 
                    leftIcon={<FiImage />} 
                    onClick={handleClickUpload}
                    flex={{ base: '1', sm: 'none' }}
                  >
                    Ajouter d'autres images
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme="red" 
                    variant="ghost" 
                    onClick={() => { setImages([]) }}
                    flex={{ base: '1', sm: 'none' }}
                  >
                    Supprimer toutes
                  </Button>
                </Flex>
              </Box>
            )}
          </FormControl>

          {/* Live preview */}
          <Box border="1px solid" borderColor={borderColor} borderRadius="lg" p={3} bg={useColorModeValue('gray.50','gray.900')}
            boxShadow="sm">
            <HStack spacing={3} align="center">
              <Box w="64px" h="64px" borderRadius="md" overflow="hidden" bg="gray.100">
                {images && images.length > 0 ? (
                  <Image src={images[0].url} alt="Aperçu" objectFit="cover" w="100%" h="100%" />
                ) : (
                  <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" color="gray.400">No image</Box>
                )}
              </Box>
              <Box flex="1">
                <Text fontWeight="600">{title || 'Titre du produit'}</Text>
                <Text fontSize="sm" color="gray.500">{selectedCategory ? (categories.find(c=>String(c.id)===String(selectedCategory))?.name || '') : 'Catégorie non sélectionnée'}</Text>
                <Text mt={1} fontWeight="700">{Number.isFinite(Number(price)) ? `${Number(price).toLocaleString()} FCFA` : 'Prix non défini'}</Text>
              </Box>
            </HStack>
          </Box>

          <Button
            type="submit"
            colorScheme="blue"
            size={buttonSize}
            height={{ base: '48px', md: '56px' }}
            borderRadius="xl"
            fontSize="md"
            fontWeight="600"
            isLoading={loading}
            loadingText="Enregistrement en cours..."
            boxShadow="0 4px 12px rgba(0,0,0,0.1)"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
            }}
            transition="all 0.3s ease"
            leftIcon={loading ? undefined : <FiCheck />}
            width="full"
            isDisabled={!canSubmit}
          >
            {id ? 'Mettre à jour le produit' : 'Créer le produit'}
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}