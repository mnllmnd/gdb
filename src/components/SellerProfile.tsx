import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Avatar,
  Heading,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Icon,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { FiUserPlus, FiUserCheck, FiPackage } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { getItem } from '../utils/localAuth'

interface SellerProfileProps {
  sellerId: string
  sellerName?: string
  productCount: number
  products: any[]
  isFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export default function SellerProfile({
  sellerId,
  sellerName = 'Vendeur',
  productCount,
  products,
  isFollowing = false,
  onFollowChange,
}: Readonly<SellerProfileProps>) {
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedText = useColorModeValue('gray.600', 'gray.400')
  const productImageBg = useColorModeValue('gray.100', 'gray.700')

  const handleFollowToggle = async () => {
    const token = getItem('token')
    if (!token) {
      toast({
        title: 'Connectez-vous',
        description: 'Vous devez être connecté pour suivre des vendeurs',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      // Toggle follow state
      const newFollowing = !following
      setFollowing(newFollowing)
      
      // Store follow state in localStorage for now
      const followedSellers = JSON.parse(localStorage.getItem('followedSellers') || '[]')
      if (newFollowing) {
        if (!followedSellers.includes(sellerId)) {
          followedSellers.push(sellerId)
        }
      } else {
        const index = followedSellers.indexOf(sellerId)
        if (index > -1) {
          followedSellers.splice(index, 1)
        }
      }
      localStorage.setItem('followedSellers', JSON.stringify(followedSellers))

      toast({
        title: newFollowing ? 'Abonné' : 'Désabonné',
        description: newFollowing
          ? `Vous suivez maintenant ${sellerName}`
          : `Vous ne suivez plus ${sellerName}`,
        status: 'success',
        duration: 2000,
      })

      onFollowChange?.(newFollowing)
    } catch (error) {
      console.error('Failed to toggle follow', error)
      setFollowing(!following)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le suivi',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor} overflow="hidden">
      {/* Header section */}
      <Box bg={useColorModeValue('brand.50', 'gray.700')} h="100px" />

      {/* Content section */}
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Seller info */}
          <VStack spacing={2} align="center" mt={-12}>
            <Avatar
              size="lg"
              name={sellerName}
              src={undefined}
              bg="brand.500"
              color="white"
            />
            <VStack spacing={0} align="center">
              <Heading size="md" color={textColor}>
                {sellerName}
              </Heading>
              <HStack spacing={2}>
                <Badge colorScheme="blue" fontSize="xs">
                  {productCount} produit{productCount === 1 ? '' : 's'}
                </Badge>
                {following && (
                  <Badge colorScheme="green" fontSize="xs">
                    Suivi
                  </Badge>
                )}
              </HStack>
            </VStack>
          </VStack>

          {/* Follow button */}
          <Button
            w="full"
            leftIcon={<Icon as={following ? FiUserCheck : FiUserPlus} />}
            colorScheme={following ? 'green' : 'blue'}
            variant={following ? 'solid' : 'outline'}
            onClick={handleFollowToggle}
            isLoading={loading}
            size="sm"
          >
            {following ? 'Suivi' : 'Suivre'}
          </Button>

          {/* Divider */}
          <Box h="1px" bg={borderColor} w="full" />

          {/* Products grid */}
          {products.length > 0 ? (
            <SimpleGrid columns={{ base: 3, sm: 3, md: 4 }} spacing={2} w="full">
              {products.map((product) => (
                <RouterLink
                  key={product.id}
                  to={`/products/${product.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    bg={productImageBg}
                    cursor="pointer"
                    transition="transform 0.2s"
                    _hover={{ transform: 'scale(1.05)' }}
                    position="relative"
                    paddingBottom="100%"
                  >
                    {product.image_url || product.product_image ? (
                      <Image
                        src={product.image_url || product.product_image}
                        alt={product.title || product.name}
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiPackage} boxSize={6} color="gray.400" />
                      </Box>
                    )}
                  </Box>
                </RouterLink>
              ))}
            </SimpleGrid>
          ) : (
            <VStack spacing={2} align="center" py={4}>
              <Icon as={FiPackage} boxSize={8} color="gray.400" />
              <Text color={mutedText} fontSize="sm">
                Aucun produit
              </Text>
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
