import React, { useEffect, useState } from 'react'
import { Heading, Text, Container, Spinner, VStack, Box, Center, Input, InputGroup, InputLeftElement, InputRightElement, IconButton } from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'
import ShopCard from '../components/ShopCard'
import api from '../services/api'

export default function Home() {
  const [shops, setShops] = useState<any[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadShops() {
      try {
        const s = await api.shops.list()
        setShops(s)
      } catch (err) {
        console.error('Failed to load shops', err)
        setShops([])
      }
    }
    loadShops()
  }, [])

  // debounce search
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (!query || query.trim() === '') {
          const s = await api.shops.list()
          setShops(s)
          return
        }
        const res = await api.shops.search(query.trim())
        setShops(res)
      } catch (err) {
        console.error('Search failed', err)
        setShops([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="start" mb={8}>
        <Heading size="xl" mb={2}>Bienvenue sur Marketplace</Heading>
        <Text fontSize="lg" color="white">
          Achetez local. Simple, beau et sécurisé.
        </Text>
      </VStack>
      
      {/* Section des boutiques */}
      <Box mb={6} w="100%">
        <InputGroup maxW="720px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher une boutique ou un produit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
          />
          {query && (
            <InputRightElement>
              <IconButton aria-label="clear" icon={<CloseIcon />} size="sm" onClick={() => setQuery('')} />
            </InputRightElement>
          )}
        </InputGroup>
      </Box>

      {shops === null && (
        <Center py={12}>
          <Spinner size="xl" color="brand.500" thickness="3px" />
        </Center>
      )}
      
      {shops && shops.length > 0 && (
        <Box>
          <Heading size="lg" mb={6}>{query ? `Résultats pour: '${query}'` : 'Boutiques'}</Heading>
          {query && <Text mb={3} color="gray.600">{shops.length} résultat{shops.length > 1 ? 's' : ''}</Text>}
          <Box 
            display="grid"
            gridTemplateColumns={{ 
              base: 'repeat(auto-fill, minmax(280px, 1fr))', 
              md: 'repeat(auto-fill, minmax(300px, 1fr))' 
            }}
            gap={{ base: 4, md: 5 }}
            alignItems="stretch"
          >
            {shops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </Box>
        </Box>
      )}

      {shops && shops.length === 0 && (
        <Center py={12}>
          <VStack spacing={4}>
            <Text fontSize="lg" color="white">
              Aucune boutique disponible pour le moment
            </Text>
            <Text color="white">
              Revenez plus tard pour découvrir nos boutiques partenaires
            </Text>
          </VStack>
        </Center>
      )}
    </Container>
  )
}