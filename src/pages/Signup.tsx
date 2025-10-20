import React, { useState } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, Text } from '@chakra-ui/react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function Signup() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState<string | undefined>('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  function validate() {
    if (!name.trim()) return 'Veuillez saisir votre nom complet.'
    if (!phone) return 'Veuillez saisir votre numéro de téléphone.'
    if (!isValidPhoneNumber(phone)) return 'Numéro de téléphone invalide. Veuillez inclure l’indicatif pays (ex : +221).'
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
      await signUpWithPhone(phone!, password, name)
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
          <PhoneInput
            international
            defaultCountry="SN"
            value={phone}
            onChange={setPhone}
            placeholder="Entrez votre numéro (ex : +221 77 123 45 67)"
            style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '16px',
              boxShadow: '0 0 4px rgba(0,0,0,0.1)'
            }}
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
