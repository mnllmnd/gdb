import React, { useState, useEffect } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, NumberInput, NumberInputField, Textarea, Image } from '@chakra-ui/react'
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

  useEffect(() => {
    if (!id) return
    // fetch product to edit
    api.products.list().then((list: any[]) => {
      const p = list.find((x) => String(x.id) === String(id))
      if (p) {
        setTitle(p.title)
        setDescription(p.description || '')
        setPrice(p.price)
        setImageUrl(p.image_url || p.image || null)
      }
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    // if creating (no id), ensure seller has a shop
    if (id) return
    (async () => {
      try {
        const token = getItem('token')
        const s = await api.shops.me(token ?? undefined)
        if (!s) {
          // no shop, send to setup
          globalThis.location.href = '/seller/setup'
        }
      } catch (err) {
        console.error('No shop found', err)
        // redirect to setup if no shop
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
      const payload: any = { title, description, price }
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
    <Container maxW="container.sm" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton />
      <Heading mb={4}>{id ? 'Modifier le produit' : 'Ajouter un produit'}</Heading>
  <Stack spacing={4} as="form" onSubmit={handleSubmit}>
        <FormControl>
          <FormLabel>Nom du produit</FormLabel>
          <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Nom" required bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Description" bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>
        <FormControl>
          <FormLabel>Prix (CFA)</FormLabel>
          <NumberInput min={0} precision={2} value={price} onChange={(v) => setPrice(Number(v) || 0)}>
            <NumberInputField bg="white" color="black" boxShadow="sm" borderRadius="md" />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel>Image</FormLabel>
          <FileInput value={file} onChange={(f) => { setFile(f); if (!f) return }} />
          {imageUrl && !file && <Image src={imageUrl} alt="current" boxSize={{ base: '96px', md: '120px' }} mt={3} objectFit="cover" borderRadius="md" />}
        </FormControl>
        <Button colorScheme="teal" type="submit" isLoading={loading}>
          Enregistrer
        </Button>
      </Stack>
    </Container>
  )
}
