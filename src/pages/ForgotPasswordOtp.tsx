import React, { useState } from 'react'
import { Box, Container, Heading, FormControl, FormLabel, Input, Button, Stack, Alert, AlertIcon, Text } from '@chakra-ui/react'
import { apiClient } from '../services/api'

export default function ForgotPasswordOtp() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      const res = await apiClient.post('/auth/forgot-password', { email })
      setMessage(res?.message || 'Si cette adresse est enregistrée, vous recevrez un code par email.')
    } catch (err: any) {
      setMessage(err?.message || 'Une erreur est survenue')
    } finally { setIsLoading(false) }
  }

  return (
    <Box minH="70vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Container maxW="md" py={8}>
        <Box bg="white" p={8} rounded="md" shadow="sm" borderWidth={1}>
          <Heading as="h2" size="lg" mb={6} textAlign="center">Recevoir le code de réinitialisation</Heading>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {message && (
                <Alert status="info"><AlertIcon /><Text>{message}</Text></Alert>
              )}
              <FormControl isRequired>
                <FormLabel>Adresse email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@exemple.com" />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isLoading}>Envoyer le code</Button>
            </Stack>
          </form>
        </Box>
      </Container>
    </Box>
  )
}
