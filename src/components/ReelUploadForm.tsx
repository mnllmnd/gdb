import React, { useEffect, useState } from 'react'
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  useToast,
  Text,
  Progress,
  HStack,
  Spinner,
  VStack,
  Card,
  CardBody,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react'
import api from '../services/api'
import { getCurrentUser } from '../services/auth'
import { useNavigate } from 'react-router-dom'

type Props = {
  onSuccess?: () => void
  onClose?: () => void
}

export default function ReelUploadForm({ onSuccess, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total?: number; percent?: number } | null>(null)
  const [uploadController, setUploadController] = useState<AbortController | null>(null)
  const toast = useToast()
  const navigate = useNavigate()

  const bgCard = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await api.products.list()
        if (!mounted) return
        const me = getCurrentUser()
        if (!me) {
          setProducts([])
          return
        }
        const owned = (list || []).filter((p: any) => String(p.seller_id) === String(me.id))
        setProducts(owned)
      } catch (err) {
        console.error('Failed to load products', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!file) return toast({ title: 'Fichier requis', status: 'warning' })
    if (!productId) return toast({ title: 'Choisir un produit', status: 'warning' })

    const me = getCurrentUser()
    if (!me || me.role !== 'seller') {
      toast({ title: 'Accès refusé', description: "Vous devez être vendeur pour publier un reel.", status: 'warning' })
      return navigate('/seller')
    }

    setLoading(true)
    setUploadProgress({ loaded: 0 })
    const controller = new AbortController()
    setUploadController(controller)
    try {
      const token = globalThis.localStorage?.getItem('token') ?? undefined
      await api.reels.uploadFile(
        file,
        { product_id: productId, caption, visibility },
        token,
        (progress) => setUploadProgress(progress as any),
        controller.signal
      )
      toast({ title: 'Reel publié', status: 'success' })
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (err: any) {
      console.error('Upload failed', err)
      const msg = String(err?.message || err)
      if (err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || /cancel/i.test(msg))) {
        toast({ title: 'Téléversement annulé', status: 'info' })
      }
      const message = err && (err.error || err.message || String(err))
      if (message === 'Forbidden' || /forbid/i.test(String(message))) {
        toast({ title: 'Interdit', description: "Vous n'êtes pas autorisé à publier pour ce produit.", status: 'error' })
      } else if (message === 'Missing auth header' || /auth/i.test(String(message))) {
        toast({ title: 'Non authentifié', description: 'Connectez-vous pour publier un reel', status: 'error' })
      } else {
        toast({ title: 'Erreur', description: message || 'Upload failed', status: 'error' })
      }
    } finally {
      setLoading(false)
      setUploadController(null)
      setUploadProgress(null)
    }
  }

  return (
    <Card bg={bgCard} borderColor={borderColor} borderWidth="1px" shadow="md" rounded="2xl" p={6}>
      <CardBody as="form" onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          <Heading size="md" mb={2}>
            Publier un Reel
          </Heading>

          {products.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              Vous n'avez aucun produit. Créez-en un pour pouvoir publier un reel.
            </Text>
          )}

          <FormControl isRequired>
  <FormLabel>Fichier vidéo</FormLabel>
  <Box
    border="2px dashed"
    borderColor={file ? 'teal.400' : useColorModeValue('gray.300', 'gray.600')}
    borderRadius="xl"
    p={6}
    textAlign="center"
    transition="all 0.2s"
    _hover={{ borderColor: 'teal.500', bg: useColorModeValue('gray.50', 'gray.700') }}
  >
    <input
      id="file-upload"
      type="file"
      accept="video/*,video/quicktime,.mov"
      style={{ display: 'none' }}
      onChange={(e: any) => setFile(e.target.files?.[0] ?? null)}
    />
    <label htmlFor="file-upload">
      <Button as="span" colorScheme="teal" variant="solid" rounded="full">
        Choisir un fichier
      </Button>
    </label>
    {file ? (
      <Text mt={3} fontSize="sm" color="teal.600">
        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} Mo)
      </Text>
    ) : (
      <Text mt={2} fontSize="sm" color="gray.500">
        Formats acceptés : mp4, mov, avi...
      </Text>
    )}
  </Box>
</FormControl>


          {uploadProgress && (
            <Box>
              <HStack justify="space-between">
                <Text fontSize="sm" color="teal.500" fontWeight="medium">
                  {uploadProgress.percent ? `${uploadProgress.percent}%` : 'Téléversement...'}
                </Text>
                {uploadProgress.total && (
                  <Text fontSize="xs" color="gray.500">
                    {(uploadProgress.loaded / (1024 * 1024)).toFixed(2)} / {(uploadProgress.total / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                )}
              </HStack>
              <Progress
                mt={2}
                value={uploadProgress.percent ?? undefined}
                isIndeterminate={uploadProgress.percent == null}
                colorScheme="teal"
                rounded="full"
                size="sm"
              />
            </Box>
          )}

          <FormControl isRequired>
            <FormLabel>Produit lié</FormLabel>
            <Select
              placeholder="Choisir un produit"
              value={productId ?? ''}
              onChange={(e) => setProductId(e.target.value)}
              variant="filled"
              bg={useColorModeValue('gray.50', 'gray.700')}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Légende</FormLabel>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Petit texte pour accompagner le reel"
              resize="vertical"
              variant="filled"
              bg={useColorModeValue('gray.50', 'gray.700')}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Visibilité</FormLabel>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              variant="filled"
              bg={useColorModeValue('gray.50', 'gray.700')}
            >
              <option value="public">Public</option>
              <option value="private">Privé</option>
            </Select>
          </FormControl>

          <HStack spacing={3} pt={2}>
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={loading}
              isDisabled={products.length === 0}
              flex="1"
              rounded="full"
            >
              Publier
            </Button>
            {uploadController && (
              <Button
                variant="outline"
                colorScheme="red"
                rounded="full"
                onClick={() => {
                  uploadController.abort()
                  setLoading(false)
                  setUploadProgress(null)
                  setUploadController(null)
                  toast({ title: 'Téléversement annulé', status: 'info' })
                }}
              >
                Annuler
              </Button>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
