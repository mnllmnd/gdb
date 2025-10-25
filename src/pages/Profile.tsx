import React from 'react'
import { Box, Heading, Text, Avatar, VStack, HStack, Button, Spinner, useColorModeValue } from '@chakra-ui/react'
import { getCurrentUser, signOut } from '../services/auth'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const user = React.useMemo(() => getCurrentUser(), [])
  const [shop, setShop] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()
  const subtle = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.100', 'gray.700')

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      if (user.role !== 'seller') return
      setLoading(true)
      try {
        const token = globalThis.localStorage?.getItem('token') ?? undefined
        const s = await api.shops.me(token)
        if (mounted) setShop(s)
      } catch (err) {
        console.error('Failed loading shop', err)
        if (mounted) setShop(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  if (!user) {
    return (
      <Box p={6}>
        <Heading size="lg">Profil</Heading>
        <Text mt={4}>Vous devez être connecté pour voir cette page.</Text>
        <Button mt={4} colorScheme="brand" onClick={() => navigate('/login')}>Se connecter</Button>
      </Box>
    )
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="900px" mx="auto">
      <HStack spacing={4} align="center">
        <Avatar name={user.display_name ?? user.phone} size="xl" />
        <VStack align="start" spacing={0}>
          <Heading size="lg">{user.display_name ?? 'Mon profil'}</Heading>
          <Text color={subtle}>{user.phone}</Text>
        </VStack>
      </HStack>

  <Box mt={6} p={6} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Heading size="md" mb={3}>Informations utilisateur</Heading>
        <VStack align="start" spacing={2}>
          <Text><strong>Nom :</strong> {user.display_name ?? '-'}</Text>
          <Text><strong>Téléphone :</strong> {user.phone ?? '-'}</Text>
          <Text><strong>Rôle :</strong> {user.role ?? 'client'}</Text>
        </VStack>
        <HStack mt={4} spacing={3}>
          <Button colorScheme="brand" onClick={() => navigate('/orders')}>Mes commandes</Button>
          <Button variant="outline" onClick={() => { signOut(); navigate('/login') }}>Se déconnecter</Button>
        </HStack>
      </Box>

      {user.role === 'seller' && (
        <Box mt={6} p={6} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <Heading size="md" mb={3}>Ma boutique</Heading>
          {(() => {
            if (loading) return <Spinner />
            if (shop) return (
              <VStack align="start">
                <HStack>
                  <Avatar name={shop.name} src={shop.logo_url} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight={600}>{shop.name}</Text>
                    <Text color={subtle}>{shop.domain}</Text>
                  </VStack>
                </HStack>
                <Text>{shop.description}</Text>
                <HStack mt={3} spacing={3}>
                  <Button as="a" href={`/shop/${shop.domain}`} colorScheme="brand">Voir la boutique</Button>
                  <Button onClick={() => navigate('/seller/shop')} variant="outline">Gérer la boutique</Button>
                </HStack>
              </VStack>
            )
            return (
              <VStack align="start">
                <Text>Aucune boutique trouvée pour ce compte.</Text>
                <Button colorScheme="brand" onClick={() => navigate('/seller')}>Créer / configurer ma boutique</Button>
              </VStack>
            )
          })()}
        </Box>
      )}
    </Box>
  )
}
