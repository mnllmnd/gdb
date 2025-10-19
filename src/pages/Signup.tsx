import React, { useState } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, Text } from '@chakra-ui/react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'

export default function Signup() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const nav = useNavigate()

  function validate() {
    if (!name.trim()) return 'Veuillez saisir votre nom'
    if (!phone.trim()) return "Veuillez saisir votre numéro de téléphone"
    if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères'
    if (password !== confirm) return 'Les mots de passe ne correspondent pas'
    return null
  }

  async function onSubmit() {
    const err = validate()
    if (err) return alert(err)
    try {
      // signUpWithPhone(phone, password, displayName, optionalEmail)
      // we keep email optional for future use
      await (await import('../services/auth')).signUpWithPhone(phone, password, name)
      nav('/')
    } catch (e: any) {
      alert(e?.error || 'Échec de l\'inscription')
    }
  }

  return (
    <Container maxW="container.sm" py={8}>
      <Heading mb={4}>Inscription — Marché Sénégal</Heading>
      <Stack as="form" spacing={4} onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
        <FormControl>
             <FormLabel>Nom complet</FormLabel>
             <Input value={name} onChange={(e) => setName(e.target.value)} bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>

        <FormControl>
             <FormLabel>Numéro de téléphone</FormLabel>
             <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="77 123 45 67" bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>

        <FormControl>
             <FormLabel>Mot de passe</FormLabel>
             <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} bg="white" color="black" boxShadow="sm" borderRadius="md" />
        </FormControl>

            <FormControl>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} bg="white" color="black" boxShadow="sm" borderRadius="md" />
            </FormControl>

        <Stack direction="row">
          <Button colorScheme="teal" onClick={onSubmit}>S'inscrire</Button>
          <Button as={RouterLink} to="/login">Déjà un compte ?</Button>
        </Stack>

        <Text fontSize="sm" color="white">En vous inscrivant, vous acceptez nos conditions d'utilisation.</Text>
      </Stack>
    </Container>
  )
}
