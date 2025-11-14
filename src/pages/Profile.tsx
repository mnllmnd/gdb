import React, { useState, useEffect } from 'react'
import { 
  Box, Heading, Text, Avatar, VStack, HStack, Button, Spinner, 
  useColorModeValue, FormControl, FormLabel, Input, Grid, 
  IconButton, useBreakpointValue, Container, Flex, Divider,
  Badge, useToast, Card, CardBody, SimpleGrid
} from '@chakra-ui/react'
import { EditIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons'
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
  const toast = useToast()

  // Design variables inspirées de ZARA
  const bgColor = useColorModeValue('white', 'black')
  const subtle = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const accentColor = 'black'
  const hoverColor = useColorModeValue('gray.50', 'gray.800')
  const sectionBg = useColorModeValue('gray.50', 'gray.800')

  // Responsive values
  const avatarSize = useBreakpointValue({ base: 'lg', md: 'xl' })
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl' })
  const gridColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 })
  const stackDirection = useBreakpointValue({ base: 'column', md: 'row' })

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

  // État d'édition du profil
  const [editing, setEditing] = useState(false)
  const [editEmail, setEditEmail] = useState<string | undefined>(user?.email ?? '')
  const [editDisplayName, setEditDisplayName] = useState<string | undefined>(user?.display_name ?? '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditEmail(user?.email ?? '')
    setEditDisplayName(user?.display_name ?? '')
  }, [user])

  // Chargement des produits aimés
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

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const token = globalThis.localStorage?.getItem('token') ?? undefined
      const res = await api.auth.updateMe({ 
        email: editEmail || null, 
        displayName: editDisplayName || null 
      }, token)
      
      if (res?.user) {
        try { 
          setItem('user', JSON.stringify(res.user)) 
        } catch (e) {}
        setUser(res.user)
        toast({
          title: "Profil mis à jour",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }
      setEditing(false)
    } catch (err) {
      console.error('Failed to update profile', err)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} textAlign="center">
          <Heading size="lg" fontWeight="normal">Profil</Heading>
          <Text color={subtle}>Vous devez être connecté pour voir cette page.</Text>
          <Button 
            colorScheme="black" 
            variant="outline"
            onClick={() => navigate('/login')}
            size="lg"
            _hover={{ bg: 'black', color: 'white' }}
          >
            Se connecter
          </Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
        
        {/* Header du profil */}
        <Flex 
          align={{ base: 'start', md: 'center' }}
          justify="space-between"
          mb={8}
          pb={6}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <HStack spacing={6} align="center">
            <Avatar 
              name={user?.display_name ?? user?.phone} 
              size={avatarSize}
              bg={accentColor}
              color="white"
              fontWeight="medium"
            />
            <VStack align="start" spacing={1}>
              <Heading size={headingSize} fontWeight="medium" letterSpacing="tight">
                {user?.display_name ?? 'Mon profil'}
              </Heading>
              <Text color={subtle} fontSize="sm">{user?.phone}</Text>
              <Badge 
                variant="subtle" 
                colorScheme={user?.role === 'seller' ? 'green' : 'blue'}
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="full"
              >
                {user?.role === 'seller' ? 'Vendeur' : 'Client'}
              </Badge>
            </VStack>
          </HStack>
          
          {!editing && (
            <IconButton
              aria-label="Modifier le profil"
              icon={<EditIcon />}
              variant="ghost"
              size="lg"
              onClick={() => setEditing(true)}
              mt={{ base: 4, md: 0 }}
              _hover={{ bg: hoverColor }}
            />
          )}
        </Flex>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={8}>
          
          {/* Colonne principale */}
          <VStack spacing={6} align="stretch">
            
            {/* Section Informations personnelles */}
            <Card 
              variant="outline" 
              borderColor={borderColor}
              borderRadius="none"
              boxShadow="none"
            >
              <CardBody p={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md" fontWeight="medium">INFORMATIONS PERSONNELLES</Heading>
                </Flex>
                
                {editing ? (
                  <VStack align="stretch" spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color={subtle}>
                        Email
                      </FormLabel>
                      <Input 
                        value={editEmail} 
                        onChange={(e) => setEditEmail(e.target.value)} 
                        placeholder="votre@exemple.com"
                        borderRadius="none"
                        borderColor={borderColor}
                        _focus={{ borderColor: accentColor, boxShadow: 'none' }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color={subtle}>
                        Nom affiché
                      </FormLabel>
                      <Input 
                        value={editDisplayName} 
                        onChange={(e) => setEditDisplayName(e.target.value)} 
                        placeholder="Nom affiché"
                        borderRadius="none"
                        borderColor={borderColor}
                        _focus={{ borderColor: accentColor, boxShadow: 'none' }}
                      />
                    </FormControl>
                    <HStack mt={2} spacing={3}>
                      <Button 
                        colorScheme="black" 
                        variant="outline"
                        onClick={handleSaveProfile}
                        isLoading={isSaving}
                        size="sm"
                        _hover={{ bg: 'black', color: 'white' }}
                      >
                        Enregistrer
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => { 
                          setEditing(false); 
                          setEditEmail(user?.email ?? ''); 
                          setEditDisplayName(user?.display_name ?? '') 
                        }}
                        size="sm"
                      >
                        Annuler
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={subtle} mb={1}>Nom</Text>
                      <Text fontWeight="medium">{user?.display_name ?? '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={subtle} mb={1}>Email</Text>
                      <Text fontWeight="medium">{user?.email ?? '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={subtle} mb={1}>Téléphone</Text>
                      <Text fontWeight="medium">{user?.phone ?? '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={subtle} mb={1}>Rôle</Text>
                      <Text fontWeight="medium">{user?.role === 'seller' ? 'Vendeur' : 'Client'}</Text>
                    </Box>
                  </SimpleGrid>
                )}
              </CardBody>
            </Card>

            {/* Section Produits aimés */}
            <Card 
              variant="outline" 
              borderColor={borderColor}
              borderRadius="none"
              boxShadow="none"
            >
              <CardBody p={6}>
                <Flex align="center" mb={4}>
                  <StarIcon mr={2} color={subtle} />
                  <Heading size="md" fontWeight="medium">PRODUITS AIMÉS</Heading>
                </Flex>
                
                {likedProducts === null ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="lg" />
                  </Flex>
                ) : likedProducts.length === 0 ? (
                  <VStack py={8} spacing={4}>
                    <Text color={subtle}>Vous n'avez aimé aucun produit pour le moment.</Text>
                    <Button 
                      variant="outline" 
                      colorScheme="black"
                      onClick={() => navigate('/')}
                      size="sm"
                    >
                      Découvrir les produits
                    </Button>
                  </VStack>
                ) : (
                  <SimpleGrid columns={gridColumns} spacing={4}>
                    {likedProducts.map(p => (
                      <ProductCard
                        key={p.id}
                        id={String(p.id)}
                        title={p.title || p.name || ''}
                        price={p.price}
                        image_url={p.image_url ?? p.product_image}
                        images={p.images}
                        quantity={p.quantity ?? p.quantite ?? p.stock ?? p.amount_available}
                        shopId={p.shop_id || p.seller_id}
                        shopName={p.shop_name || p.seller_name}
                        shopDomain={p.shop_domain || p.seller_domain}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </CardBody>
            </Card>
          </VStack>

          {/* Sidebar */}
          <VStack spacing={6} align="stretch">
            
            {/* Actions rapides */}
            <Card 
              variant="outline" 
              borderColor={borderColor}
              borderRadius="none"
              boxShadow="none"
            >
              <CardBody p={6}>
                <Heading size="md" fontWeight="medium" mb={4}>ACTIONS</Heading>
                <VStack align="stretch" spacing={2}>
                  <Button
                    justifyContent="space-between"
                    variant="ghost"
                    rightIcon={<ChevronRightIcon />}
                    onClick={() => navigate('/orders')}
                    py={3}
                    _hover={{ bg: hoverColor }}
                  >
                    Mes commandes
                  </Button>
                  <Button
                    justifyContent="space-between"
                    variant="ghost"
                    rightIcon={<ChevronRightIcon />}
                    onClick={() => { signOut(); navigate('/login') }}
                    py={3}
                    _hover={{ bg: 'red.50', color: 'red.600' }}
                  >
                    Se déconnecter
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Section Boutique pour vendeurs */}
            {user.role === 'seller' && (
              <Card 
                variant="outline" 
                borderColor={borderColor}
                borderRadius="none"
                boxShadow="none"
              >
                <CardBody p={6}>
                  <Heading size="md" fontWeight="medium" mb={4}>MA BOUTIQUE</Heading>
                  
                  {loading ? (
                    <Flex justify="center">
                      <Spinner />
                    </Flex>
                  ) : shop ? (
                    <VStack align="stretch" spacing={4}>
                      <HStack spacing={4}>
                        <Avatar name={shop.name} src={shop.logo_url} size="md" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="600">{shop.name}</Text>
                          <Text fontSize="sm" color={subtle}>@{shop.domain}</Text>
                        </VStack>
                      </HStack>
                      <Text fontSize="sm" color={subtle} noOfLines={2}>
                        {shop.description}
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        <Button 
                          as="a" 
                          href={`/shop/${shop.domain}`}
                          variant="outline"
                          colorScheme="black"
                          size="sm"
                          justifyContent="space-between"
                          rightIcon={<ChevronRightIcon />}
                          _hover={{ bg: 'black', color: 'white' }}
                        >
                          Voir la boutique
                        </Button>
                        <Button 
                          onClick={() => navigate('/seller/shop')}
                          variant="ghost"
                          size="sm"
                          justifyContent="space-between"
                          rightIcon={<ChevronRightIcon />}
                          _hover={{ bg: hoverColor }}
                        >
                          Gérer la boutique
                        </Button>
                      </VStack>
                    </VStack>
                  ) : (
                    <VStack align="stretch" spacing={4}>
                      <Text fontSize="sm" color={subtle}>
                        Aucune boutique trouvée pour ce compte.
                      </Text>
                      <Button 
                        colorScheme="black"
                        variant="outline"
                        onClick={() => navigate('/seller')}
                        size="sm"
                        _hover={{ bg: 'black', color: 'white' }}
                      >
                        Créer ma boutique
                      </Button>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            )}
          </VStack>
        </Grid>
      </Container>
    </Box>
  )
}