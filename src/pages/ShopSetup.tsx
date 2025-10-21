import React, { useState, useEffect } from 'react'
import {
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Textarea,
  Image,
  Box,
  Text,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import api from '../services/api'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'
import FileInput from '../components/FileInput'

export default function ShopSetup() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const token =
    typeof globalThis !== 'undefined' && globalThis.localStorage
      ? globalThis.localStorage.getItem('token') ?? undefined
      : undefined

  const user =
    typeof globalThis !== 'undefined' &&
    globalThis.localStorage &&
    localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user') as string)
      : null

  const bgCard = useColorModeValue('#ffffffcf', 'gray.800')
  const labelColor = useColorModeValue('gray.700', 'gray.200')
  const headingColor = useColorModeValue('blue.700', 'blue.300')
  const inputBg = useColorModeValue('gray.50', 'gray.700')

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const s = await api.shops.me(token)
        if (s) {
          setName(s.name || '')
          setDomain(s.domain || '')
          setDescription(s.description || '')
          setLogoUrl(s.logo_url || null)
        }
      } catch (err) {
        console.debug('No shop to prefill', err)
      }
    })()
  }, [token])

  async function uploadLogo() {
    if (!logo) return
    setUploading(true)
    try {
      const res = await api.uploads.uploadFile(logo, token)
      setLogoUrl(res.url)
    } catch (err: any) {
      alert(err?.error || 'Échec du téléversement')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!logo) return
    uploadLogo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo])

  async function onSave() {
    setLoading(true)
    try {
      const payload: any = { name, domain, description }
      if (logoUrl) payload.logo_url = logoUrl
      const res = await api.shops.save(payload, token)
      if (res?.token) {
        localStorage.setItem('token', res.token)
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user))
        globalThis.dispatchEvent(new Event('authChange'))
      }
      alert('Boutique enregistrée avec succès 🎉')
    } catch (err: any) {
      alert(err?.error || 'Échec de l’enregistrement')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !user) {
    return (
      <Container maxW="container.sm" py={10}>
        <BackButton />
        <Box
          bg={bgCard}
          p={8}
          rounded="2xl"
          shadow="xl"
          textAlign="center"
          backdropFilter="blur(8px)"
        >
          <Heading mb={4} color={headingColor}>
            Configurer ma boutique
          </Heading>
          <Text color="gray.500" mb={6}>
            Connectez-vous pour pouvoir créer ou configurer votre boutique.
          </Text>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => {
              globalThis.location.href = '/login'
            }}
          >
            Se connecter
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.sm" py={10}>
      <BackButton />
      <Box
        bg={bgCard}
        p={8}
        rounded="2xl"
        shadow="xl"
        backdropFilter="blur(10px)"
        transition="all 0.3s ease"
        _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }}
      >
        <Heading mb={6} textAlign="center" color={headingColor} fontWeight="semibold">
          Configurer ma boutique
        </Heading>

        <Divider mb={6} />

        <Stack spacing={5} as="form" onSubmit={(e) => { e.preventDefault(); onSave() }}>
          <FormControl isRequired>
            <FormLabel color={labelColor}>Nom de la boutique</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Boulangerie Ndiaye"
              bg={inputBg}
              borderColor="gray.300"
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 2px rgba(66,153,225,0.2)' }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel color={labelColor}>Domaine (ex: monshop.sn)</FormLabel>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="monshop.sn"
              bg={inputBg}
              borderColor="gray.300"
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 2px rgba(66,153,225,0.2)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Description courte</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Présentez brièvement votre boutique"
              bg={inputBg}
              borderColor="gray.300"
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 2px rgba(66,153,225,0.2)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Logo / Photo de profil</FormLabel>
            <FileInput value={logo} onChange={(f) => setLogo(f)} label="Choisir un logo" />
            {logoUrl && !logo && (
              <Image
                src={highRes(logoUrl) ?? SHOP_PLACEHOLDER}
                alt="logo"
                boxSize="100px"
                mt={3}
                borderRadius="full"
                objectFit="cover"
                border="2px solid #ccc"
                onError={(e: any) => {
                  e.currentTarget.src = SHOP_PLACEHOLDER
                }}
              />
            )}
          </FormControl>

          <Button
            mt={4}
            colorScheme="blue"
            size="lg"
            w="full"
            onClick={onSave}
            isLoading={loading || uploading}
            disabled={uploading}
            _hover={{ transform: 'scale(1.02)' }}
            transition="all 0.2s ease"
          >
            {uploading ? 'Téléversement...' : 'Enregistrer la boutique'}
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
