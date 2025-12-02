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
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState<string | undefined>('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  // Couleurs dans le style Zara - palette sobre et élégante
  const bgPage = useColorModeValue('white', 'black')
  const bgCard = useColorModeValue('white', 'black')
  const labelColor = useColorModeValue('gray.700', 'gray.300')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const headingColor = useColorModeValue('black', 'white')
  const inputBg = useColorModeValue('white', 'black')
  const inputBorder = useColorModeValue('gray.200', 'gray.600')
  const buttonBg = useColorModeValue('black', 'white')
  const buttonColor = useColorModeValue('white', 'black')
  const buttonHoverBg = useColorModeValue('gray.800', 'gray.100')

  function validate() {
    if (!name.trim()) return 'Veuillez saisir votre nom complet.'
    if (!email.trim()) return 'Veuillez saisir votre adresse email.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Veuillez saisir une adresse email valide.'
    if (!phone) return 'Veuillez saisir votre numéro de téléphone.'
    if (!isValidPhoneNumber(phone)) return 'Numéro de téléphone invalide. Veuillez inclure l\'indicatif pays (ex : +221).'
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
      await signUpWithPhone(phone!, password, name, email)
      nav('/')
    } catch (e: any) {
      setError(e?.error || "Échec de l'inscription")
    }
  }

  return (
    <Box bg={bgPage} minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Container maxW="md" py={10}>
        <Box
          bg={bgCard}
          p={8}
          rounded="none"
          shadow="sm"
          border="1px solid"
          borderColor={inputBorder}
          w="100%"
          transition="all 0.3s ease"
        >
          <Heading 
            textAlign="center" 
            mb={8} 
            color={headingColor}
            fontSize="2xl"
            fontWeight="normal"
            letterSpacing="wide"
          >
            S'INSCRIRE
          </Heading>

          <Stack as="form" spacing={6} onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
            <FormControl>
              <FormLabel 
                fontSize="xs" 
                fontWeight="bold" 
                color={labelColor}
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                Nom complet
              </FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                bg={inputBg}
                focusBorderColor="black"
                borderRadius="none"
                border="1px solid"
                borderColor={inputBorder}
                height="48px"
                fontSize="sm"
                _hover={{ borderColor: 'gray.400' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel 
                fontSize="xs" 
                fontWeight="bold" 
                color={labelColor}
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                Email
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg={inputBg}
                focusBorderColor="black"
                borderRadius="none"
                border="1px solid"
                borderColor={inputBorder}
                height="48px"
                fontSize="sm"
                _hover={{ borderColor: 'gray.400' }}
                placeholder="votre@exemple.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel 
                fontSize="xs" 
                fontWeight="bold" 
                color={labelColor}
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                Numéro de téléphone
              </FormLabel>
              <Box
                border="1px solid"
                borderColor={inputBorder}
                rounded="none"
                p={3}
                bg={inputBg}
                height="48px"
                display="flex"
                alignItems="center"
                transition="all 0.2s ease"
                _focusWithin={{ 
                  borderColor: 'black', 
                  boxShadow: 'none'
                }}
                _hover={{ borderColor: 'gray.400' }}
              >
                <PhoneInput
                  international
                  defaultCountry="SN"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Ex : +221 77 123 45 67"
                  countrySelectProps={{ searchable: 'true' }}
                  style={{
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '14px',
                    border: 'none',
                    outline: 'none',
                  }}
                />
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel 
                fontSize="xs" 
                fontWeight="bold" 
                color={labelColor}
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                Mot de passe
              </FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bg={inputBg}
                focusBorderColor="black"
                borderRadius="none"
                border="1px solid"
                borderColor={inputBorder}
                height="48px"
                fontSize="sm"
                _hover={{ borderColor: 'gray.400' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel 
                fontSize="xs" 
                fontWeight="bold" 
                color={labelColor}
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                Confirmer le mot de passe
              </FormLabel>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                bg={inputBg}
                focusBorderColor="black"
                borderRadius="none"
                border="1px solid"
                borderColor={inputBorder}
                height="48px"
                fontSize="sm"
                _hover={{ borderColor: 'gray.400' }}
              />
            </FormControl>

            {error && (
              <Text 
                color="red.600" 
                fontSize="sm" 
                textAlign="center" 
                fontWeight="medium"
                bg="red.50"
                p={3}
                border="1px solid"
                borderColor="red.200"
              >
                {error}
              </Text>
            )}

            <Button
              bg={buttonBg}
              color={buttonColor}
              size="lg"
              w="full"
              borderRadius="none"
              height="48px"
              fontSize="sm"
              fontWeight="normal"
              letterSpacing="wide"
              textTransform="uppercase"
              _hover={{
                bg: buttonHoverBg,
                transform: 'none'
              }}
              transition="all 0.2s ease"
              onClick={onSubmit}
            >
              S'inscrire
            </Button>

            <Divider my={2} borderColor={inputBorder} />

            <Button
              as={RouterLink}
              to="/login"
              variant="outline"
              color={headingColor}
              size="lg"
              w="full"
              borderRadius="none"
              height="48px"
              fontSize="sm"
              fontWeight="normal"
              letterSpacing="wide"
              textTransform="uppercase"
              border="1px solid"
              borderColor={inputBorder}
              _hover={{
                bg: useColorModeValue('gray.50', 'gray.700'),
                transform: 'none',
                borderColor: 'gray.400'
              }}
              transition="all 0.2s ease"
            >
              Se connecter
            </Button>

            <Text 
              fontSize="xs" 
              color={textColor} 
              textAlign="center" 
              mt={4}
              lineHeight="tall"
            >
              En vous inscrivant, vous acceptez nos conditions d'utilisation.
            </Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}