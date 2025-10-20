import React, { useState } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, Text } from '@chakra-ui/react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'

export default function Signup() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  // Validation simple du numéro de téléphone sénégalais
  const isValidPhone = (num: string) => {
    const regex = /^(7\d{1}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|7\d{8})$/
    return regex.test(num.replace(/\s+/g, ''))
  }

  function validate() {
    if (!name.trim()) return 'Veuillez saisir votre nom complet.'
    if (!phone.trim()) return 'Veuillez saisir votre numéro de téléphone.'
    if (!isValidPhone(phone)) return 'Veuillez entrer un numéro de téléphone valide (ex : 77 123 45 67).'
    if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.'
    if (password !== confirm) return 'Les mots de passe ne correspondent pas.'
    return null
  }

  async function onSubmit() {
    setError('')
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    try {
      const { signUpWithPhone } = await import('../services/auth')
      await signUpWithPhone(phone, password, name)
      nav('/')
    } catch (e: any) {
      setError(e?.error || "Échec de l'inscription")
    }
  }

  return (
    <Container maxW="container.sm" py={8}>
      <Heading mb={4}>Inscription</Heading>
      <Stack as="form" spacing={4} onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
        
        <FormControl>
          <FormLabel>Nom complet</FormLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            bg="white"
            color="black"
            boxShadow="sm"
            borderRadius="md"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Numéro de téléphone</FormLabel>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="77 123 45 67"
            bg="white"
            color="black"
            boxShadow="sm"
            borderRadius="md"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Mot de passe</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            bg="white"
            color="black"
            boxShadow="sm"
            borderRadius="md"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Confirmer le mot de passe</FormLabel>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            bg="white"
            color="black"
            boxShadow="sm"
            borderRadius="md"
          />
        </FormControl>

        {error && <Text color="red.500" fontSize="sm">{error}</Text>}

        <Stack direction="row">
          <Button colorScheme="teal" onClick={onSubmit}>
            S'inscrire
          </Button>
          <Button as={RouterLink} to="/login">
            Déjà un compte ?
          </Button>
        </Stack>

        <Text fontSize="sm" color="black">
          En vous inscrivant, vous acceptez nos conditions d'utilisation.
        </Text>
      </Stack>
    </Container>
  )
}
