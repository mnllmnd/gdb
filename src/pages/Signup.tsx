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

  const bgCard = useColorModeValue('white', 'gray.800')
  const labelColor = useColorModeValue('gray.700', 'gray.200')

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
    <Container maxW="md" py={10} display="flex" justifyContent="center" alignItems="center" minH="100vh">
      <Box
        bg={bgCard}
        p={8}
        rounded="xl"
        shadow="lg"
        w="100%"
        transition="all 0.3s ease"
        _hover={{ transform: 'translateY(-3px)', shadow: 'xl' }}
      >
        <Heading textAlign="center" mb={6} color="gray.700">
          Inscription
        </Heading>

        <Stack as="form" spacing={5} onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
          <FormControl>
            <FormLabel fontWeight="medium" color={labelColor}>
              Nom complet
            </FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              bg="gray.50"
              focusBorderColor="blue.400"
              borderRadius="md"
              shadow="xs"
              borderColor="gray.300"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="medium" color={labelColor}>
              Numéro de téléphone
            </FormLabel>
            <Box
              border="1px solid"
              borderColor="gray.300"
              rounded="md"
              p={2}
              bg="white"
              transition="all 0.2s ease"
              _focusWithin={{ borderColor: 'blue.400', shadow: '0 0 0 1px rgba(66,153,225,0.4)' }}
            >
              <PhoneInput
                international
                defaultCountry="SN"
                value={phone}
                onChange={setPhone}
                placeholder="Ex : +221 77 123 45 67"
                countrySelectProps={{ searchable: true }}
                style={{
                  backgroundColor: 'transparent',
                  width: '100%',
                  fontSize: '16px',
                  border: 'none',
                  outline: 'none',
                }}
              />
            </Box>
          </FormControl>

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
              borderRadius="md"
              shadow="xs"
              borderColor="gray.300"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="medium" color={labelColor}>
              Confirmer le mot de passe
            </FormLabel>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              bg="gray.50"
              focusBorderColor="blue.400"
              borderRadius="md"
              shadow="xs"
              borderColor="gray.300"
            />
          </FormControl>

          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center" fontWeight="medium">
              {error}
            </Text>
          )}

          <Button
            colorScheme="blue"
            bg="black"
            size="lg"
            w="full"
            shadow="md"
            _hover={{ transform: 'scale(1.02)' }}
            transition="all 0.2s ease"
            onClick={onSubmit}
          >
            S'inscrire
          </Button>

          <Divider my={2} />

          <Button
            as={RouterLink}
            to="/login"
            variant="outline"
            color="gray.800"
            size="lg"
            w="full"
            _hover={{
              bg: useColorModeValue('gray.100', 'gray.700'),
              transform: 'scale(1.02)',
            }}
            transition="all 0.2s ease"
          >
            Déjà un compte ? Se connecter
          </Button>

          <Text fontSize="sm" color="gray.600" textAlign="center" mt={2}>
            En vous inscrivant, vous acceptez nos conditions d’utilisation.
          </Text>
        </Stack>
      </Box>
    </Container>
  )
}
