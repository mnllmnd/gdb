import React, { useState } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, Textarea, Image } from '@chakra-ui/react'
import BackButton from '../components/BackButton'
import api from '../services/api'

export default function ShopSetup() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const token = (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage.getItem('token') ?? undefined : undefined
  const user = (typeof globalThis !== 'undefined' && globalThis.localStorage && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user') as string) : null

  async function uploadLogo() {
    if (!logo) return
    setLoading(true)
    try {
      const res = await api.uploads.uploadFile(logo, token)
      setLogoUrl(res.url)
    } catch (err: any) {
      alert(err?.error || 'Échec upload')
    } finally { setLoading(false) }
  }

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
      <Container maxW="container.sm" py={8}>
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
    <Container maxW="container.sm" py={8}>
      <BackButton />
      <Heading mb={4}>Configurer ma boutique</Heading>
      <Stack spacing={4} as="form" onSubmit={(e)=>{ e.preventDefault(); onSave() }}>
        <FormControl>
          <FormLabel>Nom de la boutique</FormLabel>
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ex: Boulangerie Ndiaye" />
        </FormControl>
        <FormControl>
          <FormLabel>Domaine (ex: monshop.sn)</FormLabel>
          <Input value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="monshop.sn" />
        </FormControl>
        <FormControl>
          <FormLabel>Description courte</FormLabel>
          <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Présentez votre boutique en une phrase" />
        </FormControl>
        <FormControl>
          <FormLabel>Logo / Photo de profil</FormLabel>
          <Input type="file" accept="image/*" onChange={async (e)=>{
            const file = e.target.files?.[0] ?? null
            setLogo(file)
            if (file) {
              setLoading(true)
              try {
                const res = await api.uploads.uploadFile(file, token)
                setLogoUrl(res.url)
              } catch (err:any) {
                alert(err?.error || 'Échec upload')
              } finally { setLoading(false) }
            }
          }} />
          {logoUrl && <Image src={logoUrl} alt="logo" boxSize="100px" mt={2} objectFit="cover" borderRadius="full" />}
          <Stack direction="row" mt={2}>
            <Button colorScheme="teal" onClick={onSave} isLoading={loading}>Enregistrer la boutique</Button>
          </Stack>
        </FormControl>
      </Stack>
    </Container>
  )
}
