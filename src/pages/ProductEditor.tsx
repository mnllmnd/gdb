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
} from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import FileInput from '../components/FileInput'

export default function ProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()

  const bgForm = useColorModeValue('whiteAlpha.800', 'gray.800')
  const labelColor = useColorModeValue('gray.700', 'gray.200')

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = getItem('token')
      let image_url: string | undefined
      if (file) {
        const upl = await api.uploads.uploadFile(file, token ?? undefined)
        image_url = upl.url
      }

      if (!selectedCategory) {
        alert('Veuillez sélectionner une catégorie')
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
      } else {
        await api.products.create(payload, token ?? undefined)
      }

      navigate('/seller/shop')
    } catch (err: any) {
      console.error(err)
      alert(err?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.sm" py={10} pb={{ base: '120px', md: 10 }} overflow="visible">
      <BackButton />
      <Heading mb={6} textAlign="center" fontSize="2xl" color="white">
        {id ? 'Modifier le produit' : 'Ajouter un produit'}
      </Heading>

      <Box
        bg={bgForm}
        p={6}
        borderRadius="2xl"
        boxShadow="md"
        backdropFilter="blur(8px)"
      >
        <Stack spacing={5} as="form" onSubmit={handleSubmit}>
          <FormControl isRequired>
            <FormLabel color={labelColor}>Nom du produit</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Tasse en céramique"
              bg="white"
              color="black"
              borderRadius="md"
              boxShadow="sm"
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement le produit"
              bg="white"
              color="black"
              borderRadius="md"
              boxShadow="sm"
              minH="100px"
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Prix (FCFA)</FormLabel>
            <NumberInput min={0} precision={2} value={price} onChange={(v) => setPrice(Number(v) || 0)}>
              <NumberInputField
                bg="white"
                color="black"
                borderRadius="md"
                boxShadow="sm"
                placeholder="0.00"
              />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel color={labelColor}>Catégorie</FormLabel>
            <Select
              placeholder="Sélectionnez une catégorie"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(Number(e.target.value))}
              bg="white"
              color="black"
              borderRadius="md"
              boxShadow="sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Image du produit</FormLabel>
            <FileInput value={file} onChange={(f) => setFile(f)} label="Choisir une image" />
            {imageUrl && !file && (
              <Image
                src={imageUrl}
                alt="Produit"
                boxSize={{ base: '96px', md: '120px' }}
                mt={3}
                objectFit="cover"
                borderRadius="md"
                boxShadow="sm"
              />
            )}
          </FormControl>

          <Button
            type="submit"
            colorScheme="teal"
            size="lg"
            borderRadius="xl"
            isLoading={loading}
            loadingText="Enregistrement..."
            _hover={{ bg: 'teal.600' }}
          >
            Enregistrer
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
