import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Alert,
  AlertIcon,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '../services/api'

export default function ResetPasswordWithCode() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const bgColor = useColorModeValue('white', 'black')
  const boxShadow = useColorModeValue('sm', 'dark-lg')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    const e = searchParams.get('email')
    if (e) setEmail(e)
  }, [searchParams])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (newPassword !== confirm) return setMessage('Les mots de passe ne correspondent pas')
    setLoading(true)
    try {
      const res = await apiClient.post('/auth/reset-password', { email, code, newPassword })
      if (res?.success) {
        setMessage(res.message || 'Mot de passe réinitialisé')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setMessage(res?.message || 'Erreur')
      }
    } catch (err: any) {
      setMessage(err?.message || 'Erreur serveur')
    } finally { setLoading(false) }
  }

  return (
    <Box minH="70vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Container maxW="md" py={8}>
        <Box bg={bgColor} p={8} rounded="md" shadow={boxShadow} borderWidth={1} borderColor={borderColor}>
          <Heading as="h2" size="lg" mb={6} textAlign="center">Réinitialiser le mot de passe (code)</Heading>
          <form onSubmit={onSubmit}>
            <Stack spacing={4}>
              {message && (
                <Alert status={message.includes('réinitialisé') ? 'success' : 'error'}>
                  <AlertIcon />
                  <Text>{message}</Text>
                </Alert>
              )}
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Code (6 chiffres)</FormLabel>
                <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={loading}>Réinitialiser</Button>
            </Stack>
          </form>
        </Box>
      </Container>
    </Box>
  )
}
