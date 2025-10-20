import React, { useState } from 'react'
import { Container, Heading, FormControl, FormLabel, Input, Button, Stack, Text } from '@chakra-ui/react'
import { signInWithPhone, signInWithGoogle } from '../services/auth'
import { useNavigate } from 'react-router-dom'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function Login() {
  const [phone, setPhone] = useState<string | undefined>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function onSignIn(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')

    if (!phone) {
      setError('Veuillez saisir votre numéro de téléphone.')
      return
    }

    if (!isValidPhoneNumber(phone)) {
      setError('Numéro de téléphone invalide. Veuillez inclure l’indicatif pays (ex : +221).')
      return
    }

    try {
      await signInWithPhone(phone, password)
      nav('/')
    } catch (err: any) {
      setError(err?.error || 'Échec de connexion')
    }
  }

  return (
    <Container maxW="container.sm" py={8}>
      <Heading mb={4}>Connexion</Heading>

      <Stack as="form" spacing={4} onSubmit={onSignIn}>
        <FormControl>
          <FormLabel>Numéro de téléphone</FormLabel>
          <PhoneInput
            international
            defaultCountry="SN"
            value={phone}
            onChange={setPhone}
            placeholder="Entrez votre numéro (ex : +221 77 123 45 67)"
            countrySelectProps={{ searchable: true }}
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

        {error && <Text color="red.500" fontSize="sm">{error}</Text>}

        <Stack direction="row">
          <Button colorScheme="teal" onClick={onSignIn}>
            Se connecter
          </Button>
        </Stack>

        <Button
          onClick={async () => {
            try {
              await signInWithGoogle()
              nav('/')
            } catch (err: any) {
              setError(err?.error || 'Connexion Google échouée')
            }
          }}
        >
          Connexion Google
        </Button>
      </Stack>
    </Container>
  )
}
