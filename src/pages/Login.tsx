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
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function Login() {
  const [phone, setPhone] = useState<string | undefined>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  // 🎨 Palette de couleurs style Zara
  const bgPage = useColorModeValue('white', 'black')
  const bgCard = useColorModeValue('white', 'blaclk')
  const labelColor = useColorModeValue('gray.700', 'gray.300')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const headingColor = useColorModeValue('black', 'white')
  const inputBg = useColorModeValue('white', 'black')
  const inputBorder = useColorModeValue('gray.200', 'gray.600')
  const buttonBg = useColorModeValue('black', 'white')
  const buttonColor = useColorModeValue('white', 'black')
  const buttonHoverBg = useColorModeValue('gray.800', 'gray.100')

  async function onSignIn(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')

    if (!phone) {
      setError('Veuillez saisir votre numéro de téléphone.')
      return
    }

    if (!isValidPhoneNumber(phone)) {
      setError('Numéro de téléphone invalide. Ex : +221 77 123 45 67')
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
            SE CONNECTER
          </Heading>

          <Stack as="form" spacing={6} onSubmit={onSignIn}>
            {/* Champ téléphone */}
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
                  countrySelectProps={{ searchable: true }}
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

            {/* Champ mot de passe */}
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

            {/* Bouton principal */}
            <Button
              type="submit"
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
              onClick={onSignIn}
            >
              Se connecter
            </Button>

            <Divider my={2} borderColor={inputBorder} />

            {/* Connexion Google */}
            <Button
              leftIcon={<FcGoogle size={20} />}
              variant="outline"
              color={headingColor}
              size="lg"
              w="full"
              borderRadius="none"
              height="48px"
              fontSize="sm"
              fontWeight="normal"
              letterSpacing="wide"
              border="1px solid"
              borderColor={inputBorder}
              _hover={{
                bg: useColorModeValue('gray.50', 'gray.700'),
                transform: 'none',
                borderColor: 'gray.400'
              }}
              transition="all 0.2s ease"
              onClick={async () => {
                try {
                  await signInWithGoogle()
                  nav('/')
                } catch (err: any) {
                  setError(err?.error || 'Connexion Google échouée')
                }
              }}
            >
              Continuer avec Google
            </Button>

            {/* Lien inscription */}
            <Button
              as={RouterLink}
              to="/signup"
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
              Créer un compte
            </Button>

            <Text 
              fontSize="xs" 
              color={textColor} 
              textAlign="center" 
              mt={4}
              lineHeight="tall"
            >
              En vous connectant, vous acceptez nos conditions d'utilisation.
            </Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}