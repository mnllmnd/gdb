import React, { useState, useEffect } from 'react'
import { Box, Heading, Text, Avatar, VStack, HStack, Button, Spinner, useColorModeValue, FormControl, FormLabel, Input } from '@chakra-ui/react'
import ProductCard from '../components/ProductCard'
import { getCurrentUser, signOut } from '../services/auth'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { setItem } from '../utils/localAuth'

export default function ProfilePage() {
  const [user, setUser] = useState(() => getCurrentUser())
  const [shop, setShop] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [likedProducts, setLikedProducts] = React.useState<any[] | null>(null)
  const navigate = useNavigate()
  const subtle = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const sectionBg = useColorModeValue('white', 'gray.800')

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

  // editable profile state
  const [editing, setEditing] = useState(false)
  const [editEmail, setEditEmail] = useState<string | undefined>(user?.email ?? '')
  const [editDisplayName, setEditDisplayName] = useState<string | undefined>(user?.display_name ?? '')

  useEffect(() => {
    // Keep editable fields in sync if user changes
    setEditEmail(user?.email ?? '')
    setEditDisplayName(user?.display_name ?? '')
  }, [user])

  // Load liked products for the profile section
  React.useEffect(() => {
    let mounted = true
    const loadLikes = async () => {
      if (!user) return
      try {
        const token = globalThis.localStorage?.getItem('token') ?? undefined
        const likes = await api.user.myLikes(token)
        if (!mounted) return
        setLikedProducts(likes || [])
      } catch (err) {
        console.error('Failed to load liked products', err)
        if (mounted) setLikedProducts([])
      }
    }
    loadLikes()
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
        <Avatar name={user?.display_name ?? user?.phone} size="xl" />
        <VStack align="start" spacing={0}>
          <Heading size="lg">{user?.display_name ?? 'Mon profil'}</Heading>
          <Text color={subtle}>{user?.phone}</Text>
        </VStack>
      </HStack>

      <Box mt={6} p={6} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Heading size="md" mb={3}>Informations utilisateur</Heading>
        {editing ? (
          <VStack align="start" spacing={3}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="votre@exemple.com" />
            </FormControl>
            <FormControl>
              <FormLabel>Nom affiché</FormLabel>
              <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder="Nom affiché" />
            </FormControl>
            <HStack mt={2} spacing={3}>
              <Button colorScheme="brand" onClick={async () => {
                // save
                try {
                  const token = globalThis.localStorage?.getItem('token') ?? undefined
                  const res = await api.auth.updateMe({ email: editEmail || null, displayName: editDisplayName || null }, token)
                  if (res?.user) {
                    // update local storage and state
                    try { setItem('user', JSON.stringify(res.user)) } catch (e) {}
                    setUser(res.user)
                  }
                  setEditing(false)
                } catch (err) {
                  console.error('Failed to update profile', err)
                  // TODO: show user-facing error
                }
              }}>Enregistrer</Button>
              <Button variant="outline" onClick={() => { setEditing(false); setEditEmail(user?.email ?? ''); setEditDisplayName(user?.display_name ?? '') }}>Annuler</Button>
            </HStack>
          </VStack>
        ) : (
          <VStack align="start" spacing={2}>
            <Text><strong>Nom :</strong> {user?.display_name ?? '-'}</Text>
            <Text><strong>Email :</strong> {user?.email ?? '—'}</Text>
            <Text><strong>Téléphone :</strong> {user?.phone ?? '-'}</Text>
            <Text><strong>Rôle :</strong> {user?.role ?? 'client'}</Text>
            <HStack mt={4} spacing={3}>
              <Button colorScheme="brand" onClick={() => navigate('/orders')}>Mes commandes</Button>
              <Button variant="outline" onClick={() => { setEditing(true); }} bg={sectionBg}>Modifier mes infos</Button>
              <Button variant="outline" onClick={() => { signOut(); navigate('/login') }} bg={sectionBg}>Se déconnecter</Button>
            </HStack>
          </VStack>
        )}
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
                  <Button onClick={() => navigate('/seller/shop')} variant="outline" bg={sectionBg}>Gérer la boutique</Button>
                </HStack>
              </VStack>
            )
            return (
              <VStack align="start">
                <Text>Aucune boutique trouvée pour ce compte.</Text>
                <Button colorScheme="brand" onClick={() => navigate('/seller')} bg={sectionBg}>Créer / configurer ma boutique</Button>
              </VStack>
            )
          })()}
        </Box>
      )}

      <Box mt={6} p={6} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Heading size="md" mb={3}>Produits aimés</Heading>
        {likedProducts === null ? (
          <Spinner />
        ) : likedProducts.length === 0 ? (
          <Text>Vous n'avez aimé aucun produit pour le moment.</Text>
        ) : (
          <VStack align="stretch" spacing={3}>
            {likedProducts.map(p => (
              <Box key={p.id}>
                <ProductCard
                  id={String(p.id)}
                  title={p.title || p.name || ''}
                  price={p.price}
                  image_url={p.image_url ?? p.product_image}
                  images={p.images}
                  quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                  shopId={p.shop_id || p.seller_id}
                />
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}
