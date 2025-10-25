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
} from '@chakra-ui/react'
import { FiUpload, FiImage, FiX, FiCheck } from 'react-icons/fi'
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
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()

  const bgForm = useColorModeValue('white', 'gray.800')
  const labelColor = useColorModeValue('gray.700', 'gray.200')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBorderColor = useColorModeValue('blue.400', 'blue.300')

  useEffect(() => {
    api.categories.list().then(setCategories).catch(console.error)

    if (!id) return
    api.products.list()
      .then((list: any[]) => {
        const p = list.find((x) => String(x.id) === String(id))
        if (p) {
          setTitle(p.title)
          setDescription(p.description || '')
          setPrice(p.price)
          setImageUrl(p.image_url || p.image || null)
          setSelectedCategory(p.category_id)
        }
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (id) return
    (async () => {
      try {
        const token = getItem('token')
        const s = await api.shops.me(token ?? undefined)
        if (!s) globalThis.location.href = '/seller/setup'
      } catch (err) {
        console.error('No shop found', err)
        globalThis.location.href = '/seller/setup'
      }
    })()
  }, [id])

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile)
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setImageUrl(url)
      setUploadProgress(0)
      
      // Simulation de progression d'upload
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)
    } else {
      setImageUrl(null)
      setUploadProgress(0)
    }
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
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile)
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
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files[0]) {
        handleFileSelect(target.files[0])
      }
    }
    input.click()
  }

  const removeImage = () => {
    setFile(null)
    setImageUrl(null)
    setUploadProgress(0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    // Simulation de fin d'upload
    setUploadProgress(100)
    
    try {
      const token = getItem('token')
      let image_url: string | undefined
      
      if (file) {
        const upl = await api.uploads.uploadFile(file, token ?? undefined)
        image_url = upl.url
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
        category_id: selectedCategory,
      }
      if (image_url) payload.image_url = image_url

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
        await api.products.create(payload, token ?? undefined)
        toast({
          title: 'Produit créé',
          description: 'Votre produit a été ajouté avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      navigate('/seller/shop')
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
    <Container maxW="container.sm" py={10} pb={{ base: '120px', md: 10 }} overflow="visible">
      <BackButton />
      <Heading 
        mb={6} 
        textAlign="center" 
        fontSize="2xl" 
        bgGradient="linear(to-r, white)"
        bgClip="text"
        fontWeight="700"
      >
        {id ? 'Modifier le produit' : 'Ajouter un produit'}
      </Heading>

      <Box
        bg={bgForm}
        p={8}
        borderRadius="2xl"
        boxShadow="0 8px 32px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor={borderColor}
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

          <FormControl>
            <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
              Prix (FCFA)
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

          <FormControl isRequired>
            <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={2}>
              Catégorie
            </FormLabel>
            <Select
              placeholder="Choisissez une catégorie"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(Number(e.target.value))}
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
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
  <FormLabel color={labelColor} fontWeight="600" fontSize="sm" mb={3}>
    Image du produit
  </FormLabel>

  {!imageUrl ? (
    <Box
      border="2px dashed"
      borderColor={isDragging ? 'blue.400' : borderColor}
      borderRadius="xl"
      p={8}
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
          <Text fontWeight="600" color="gray.700" mb={1}>
            Cliquez pour uploader ou glissez-déposez
          </Text>
          <Text fontSize="sm" color="gray.500">
            PNG, JPG, WEBP jusqu’à 10 MB
          </Text>
        </Box>
        <Button
          colorScheme="blue"
          variant="outline"
          size="sm"
          leftIcon={<FiImage />}
        >
          Choisir une image
        </Button>
      </VStack>
    </Box>
  ) : (
    <Box
      border="2px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      position="relative"
      boxShadow="sm"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.3s ease"
      maxW="320px"
      mx="auto"
    >
      <AspectRatio ratio={4 / 3}>
        <Image
          src={imageUrl}
          alt="Aperçu du produit"
          objectFit="cover"
          w="100%"
          h="100%"
        />
      </AspectRatio>

      {/* Bouton supprimer simple */}
      <Icon
        as={FiX}
        boxSize={6}
        color="white"
        bg="red.500"
        borderRadius="full"
        p={1}
        position="absolute"
        top={3}
        right={3}
        cursor="pointer"
        _hover={{ bg: 'red.600' }}
        onClick={removeImage}
        transition="all 0.2s ease"
      />
    </Box>
  )}
</FormControl>


          <Button
            type="submit"
            colorScheme="blue"
            bg="black"
            size="lg"
            height="56px"
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
          >
            {id ? 'Mettre à jour le produit' : 'Créer le produit'}
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}