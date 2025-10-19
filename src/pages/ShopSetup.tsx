import React, { useState, useEffect } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, Textarea, Image } from '@chakra-ui/react'
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

  const token = (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage.getItem('token') ?? undefined : undefined
  const user = (typeof globalThis !== 'undefined' && globalThis.localStorage && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user') as string) : null

  useEffect(() => {
    if (!token) return
    (async () => {
      try {
        const s = await api.shops.me(token)
        if (s) {
          setName(s.name || '')
          setDomain(s.domain || '')
          setDescription(s.description || '')
          setLogoUrl(s.logo_url || null)
        }
      } catch (err) {
        // ignore: prefill is optional
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
      alert(err?.error || 'Échec upload')
    } finally { setUploading(false) }
  }

  // Auto-upload when a new file is selected
  useEffect(() => {
    if (!logo) return
    // perform upload in background
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
      alert('Boutique enregistrée')
    } catch (err: any) {
      alert(err?.error || 'Échec enregistrement')
    } finally { setLoading(false) }
  }

  if (!token || !user) {
    return (
      <Container maxW="container.sm" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
        <BackButton />
        <Heading mb={4}>Configurer ma boutique</Heading>
        <p>Connectez-vous pour pouvoir configurer votre boutique.</p>
        <Stack direction="row" mt={4}>
          <Button colorScheme="brand" onClick={() => { globalThis.location.href = '/login' }}>Se connecter</Button>
        </Stack>
      </Container>
    )
  }

  return (
    <Container maxW="container.sm" py={8} pb={{ base: '120px', md: 8 }} overflow="visible">
      <BackButton />
      <Heading mb={4}>Configurer ma boutique</Heading>
      <Stack spacing={4} as="form" onSubmit={(e)=>{ e.preventDefault(); onSave() }}>
        <FormControl>
          <FormLabel>Nom de la boutique</FormLabel>
          <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setName(e.target.value)} placeholder="Ex: Boulangerie Ndiaye" bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>
        <FormControl>
          <FormLabel>Domaine (ex: monshop.sn)</FormLabel>
          <Input value={domain} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setDomain(e.target.value)} placeholder="monshop.sn" bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>
        <FormControl>
          <FormLabel>Description courte</FormLabel>
          <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setDescription(e.target.value)} placeholder="Présentez votre boutique en une phrase" bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>
        <FormControl>
          <FormLabel>Logo / Photo de profil</FormLabel>
          <FileInput value={logo} onChange={(f) => { setLogo(f); }} label="Choisir un logo" />
          {logoUrl && !logo && (
            <Image
              src={highRes(logoUrl) ?? SHOP_PLACEHOLDER}
              alt="logo"
              boxSize="100px"
              mt={2}
              objectFit="cover"
              borderRadius="full"
              onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
            />
          )}
          <Stack direction="row" mt={2}>
            <Button colorScheme="brand" onClick={onSave} isLoading={loading || uploading} disabled={uploading}>
              {uploading ? 'Téléversement...' : 'Enregistrer la boutique'}
            </Button>
          </Stack>
        </FormControl>
      </Stack>
    </Container>
  )
}
