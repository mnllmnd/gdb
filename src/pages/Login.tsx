import React, { useState } from 'react'
import {
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Text,
  Box,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import { FcGoogle } from 'react-icons/fc'
import { signInWithPhone, signInWithGoogle } from '../services/auth'
import { useNavigate } from 'react-router-dom'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function Login() {
  const [phone, setPhone] = useState<string | undefined>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  const bgCard = useColorModeValue('white', 'gray.800')
  const labelColor = useColorModeValue('gray.700', 'gray.200')

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
    <Container maxW="md" py={10} display="flex" justifyContent="center" alignItems="center" minH="100vh">
      <Box
        bg={bgCard}
        p={8}
        rounded="xl"
        shadow="md"
        w="100%"
        transition="all 0.3s ease"
        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      >
        <Heading textAlign="center" mb={6} color="gray.700" fontWeight="semibold">
          Connexion
        </Heading>

        <Stack as="form" spacing={5} onSubmit={onSignIn}>
          {/* Champ téléphone */}
          <FormControl>
            <FormLabel fontWeight="medium" color={labelColor}>
              Numéro de téléphone
            </FormLabel>
            <Box
              border="1px solid"
              borderColor="gray.300"
              rounded="md"
              px={3}
              py={2}
              bg="white"
              transition="all 0.2s ease"
              _focusWithin={{
                borderColor: 'blue.400',
                boxShadow: '0 0 0 2px rgba(66,153,225,0.15)',
              }}
            >
              <PhoneInput
                international
                defaultCountry="SN"
                value={phone}
                onChange={setPhone}
                placeholder="Ex : +221 77 123 45 67"
                countrySelectProps={{ searchable: true }}
                style={{
                  border: 'none',         // ✅ enlève la bordure noire interne
                  outline: 'none',        // ✅ empêche tout contour noir
                  width: '100%',
                  fontSize: '16px',
                  backgroundColor: 'transparent',
                }}
              />
            </Box>
          </FormControl>

          {/* Champ mot de passe */}
          <FormControl>
            <FormLabel fontWeight="medium" color={labelColor}>
              Mot de passe
            </FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="gray.50"
              focusBorderColor="blue.400"
              borderColor="gray.300"
              borderRadius="md"
              shadow="xs"
              _focus={{ shadow: '0 0 0 2px rgba(66,153,225,0.15)' }}
            />
          </FormControl>

          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center" fontWeight="medium">
              {error}
            </Text>
          )}

          {/* Boutons */}
          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            w="full"
            shadow="sm"
            _hover={{ transform: 'scale(1.02)' }}
            transition="all 0.2s ease"
            onClick={onSignIn}
          >
            Se connecter
          </Button>

          <Divider my={3} />

          <Button
            leftIcon={<FcGoogle />}
            variant="outline"
            size="lg"
            w="full"
            onClick={async () => {
              try {
                await signInWithGoogle()
                nav('/')
              } catch (err: any) {
                setError(err?.error || 'Connexion Google échouée')
              }
            }}
            _hover={{
              bg: useColorModeValue('gray.100', 'gray.700'),
              transform: 'scale(1.02)',
            }}
            transition="all 0.2s ease"
          >
            Continuer avec Google
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
