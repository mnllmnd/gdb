import React, { useState } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack } from '@chakra-ui/react'
import { signInWithPhone, signInWithGoogle } from '../services/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  async function onSignIn() {
    try {
      await signInWithPhone(phone, password)
      nav('/')
    } catch (err: any) {
      alert(err?.error || 'Échec de connexion')
    }
  }

  return (
    <Container maxW="container.sm" py={8}>
      <Heading mb={4}>Connexion</Heading>
      <Stack as="form" spacing={4}>
        <FormControl>
          <FormLabel>Numéro de téléphone</FormLabel>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 123 45 67" />
        </FormControl>
        <FormControl>
          <FormLabel>Mot de passe</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        <Stack direction="row">
          <Button colorScheme="teal" onClick={onSignIn}>
            Se connecter
          </Button>
        </Stack>
        <Button onClick={async () => { await signInWithGoogle(); nav('/') }}>Connexion Google</Button>
      </Stack>
    </Container>
  )
}
