import React, { useEffect, useState } from 'react'
import {
  Container,
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
        // Only show products owned by current user (seller)
        const owned = (list || []).filter((p: any) => String(p.seller_id) === String(me.id))
        setProducts(owned)
      } catch (err) {
        console.error('Failed to load products', err)
      }
    })()
    return () => { mounted = false }
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
        (progress) => {
          // progress = { loaded, total?, percent? }
          setUploadProgress(progress as any)
        },
        controller.signal
      )
      toast({ title: 'Reel publié', status: 'success' })
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (err: any) {
      console.error('Upload failed', err)
      // detect abort
      const msg = String(err?.message || err)
      if (err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || /cancel/i.test(msg))) {
        toast({ title: 'Téléversement annulé', status: 'info' })
      }
      const message = err && (err.error || err.message || String(err))
      if (message === 'Forbidden' || /forbid/i.test(String(message))) {
        toast({ title: 'Interdit', description: "Vous n'êtes pas autorisé à publier pour ce produit (propriétaire requis)", status: 'error', duration: 6000 })
      } else if (message === 'Missing auth header' || /auth/i.test(String(message))) {
        toast({ title: 'Non authentifié', description: 'Connectez-vous pour publier un reel', status: 'error' })
      } else {
        toast({ title: 'Erreur', description: message || 'Upload failed', status: 'error' })
      }
    } finally {
      setLoading(false)
      setUploadProgress(null)
      setUploadController(null)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      {products.length === 0 && (
        <Text mb={3} color="gray.600">Vous n'avez aucun produit. Créez un produit dans votre boutique pour pouvoir publier un reel.</Text>
      )}

      <FormControl mb={3} isRequired>
        <FormLabel>Fichier vidéo</FormLabel>
        {/* Accept common video types and explicitly include QuickTime/.mov (iPhone screen recordings) */}
        <Input
          type="file"
          accept="video/*,video/quicktime,.mov"
          onChange={(e: any) => setFile(e.target.files?.[0] ?? null)}
        />
      
      </FormControl>

      {uploadProgress && (
        <Box mb={3}>
          <HStack spacing={3} alignItems="center">
            {uploadProgress.percent != null ? (
              <Text fontSize="sm">{uploadProgress.percent}%</Text>
            ) : (
              <HStack>
                <Spinner size="sm" />
                <Text fontSize="sm">Téléversement en cours</Text>
              </HStack>
            )}
            {uploadProgress.total ? (
              <Text fontSize="xs" color="gray.500">{(uploadProgress.loaded / (1024 * 1024)).toFixed(2)} / {(uploadProgress.total / (1024 * 1024)).toFixed(2)} MB</Text>
            ) : (
              <Text fontSize="xs" color="gray.500">{(uploadProgress.loaded / (1024 * 1024)).toFixed(2)} MB</Text>
            )}
          </HStack>
          <Progress mt={2} value={uploadProgress.percent ?? undefined} isIndeterminate={uploadProgress.percent == null} size="sm" />
        </Box>
      )}

      <FormControl mb={3} isRequired>
        <FormLabel>Produit</FormLabel>
        <Select placeholder="Choisir un produit" value={productId ?? ''} onChange={(e) => setProductId(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
        </Select>
      </FormControl>

      <FormControl mb={3}>
        <FormLabel>Légende</FormLabel>
        <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Petit texte pour accompagner le reel" />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Visibilité</FormLabel>
        <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="public">Public</option>
          <option value="private">Privé</option>
        </Select>
      </FormControl>

      <HStack spacing={3}>
        <Button type="submit" colorScheme="teal" isLoading={loading} isDisabled={products.length === 0}>Publier</Button>
        {uploadController && (
          <Button variant="ghost" colorScheme="red" onClick={() => {
            uploadController.abort()
            setLoading(false)
            setUploadProgress(null)
            setUploadController(null)
            toast({ title: 'Annulé', status: 'info' })
          }}>Annuler</Button>
        )}
      </HStack>
    </Box>
  )
}
