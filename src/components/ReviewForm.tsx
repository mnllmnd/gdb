import React from 'react'
import { Box, Button, Textarea, VStack, HStack, Text, useToast, Icon } from '@chakra-ui/react'
import { StarIcon } from '@chakra-ui/icons'
import api from '../services/api'

export default function ReviewForm({ productId, shopId, onSuccess }: { productId?: string; shopId?: string; onSuccess?: () => void }) {
  const [rating, setRating] = React.useState<number>(5)
  const [hoverRating, setHoverRating] = React.useState<number>(0)
  const [comment, setComment] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const toast = useToast()

  const submit = async () => {
    if (!productId && !shopId) {
      toast({ title: 'Erreur', description: 'Produit ou boutique requis', status: 'error', duration: 3000 })
      return
    }
    if (!rating || rating < 1 || rating > 5) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une note', status: 'error', duration: 3000 })
      return
    }
    setLoading(true)
    try {
      const token = (globalThis as any)?.localStorage?.getItem?.('token')
      await api.reviews.create({ product_id: productId, shop_id: shopId, rating, comment: comment || undefined }, token ?? undefined)
      toast({ 
        title: '✨ Merci pour votre avis !', 
        description: 'Votre retour a bien été enregistré', 
        status: 'success',
        duration: 4000,
        isClosable: true
      })
      setComment('')
      setRating(5)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Review submit failed', err)
      toast({ 
        title: 'Erreur', 
        description: err?.error || 'Impossible d\'envoyer l\'avis', 
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      borderRadius="xl" 
      p={6} 
      bg="white" 
      boxShadow="md"
      border="1px solid"
      borderColor="gray.100"
      transition="all 0.3s"
      _hover={{ boxShadow: 'lg' }}
    >
      <VStack align="stretch" spacing={4}>
        <Text fontSize="lg" fontWeight={700} color="gray.800">
          ✍️ Laisser un avis
        </Text>

        {/* Star Rating */}
        <Box>
          <Text fontSize="sm" fontWeight={600} color="gray.600" mb={2}>
            Votre note
          </Text>
          <HStack spacing={2}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                as={StarIcon}
                boxSize={8}
                cursor="pointer"
                color={(hoverRating || rating) >= star ? 'yellow.400' : 'gray.300'}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.1)' }}
              />
            ))}
            <Text fontSize="sm" color="gray.600" ml={2} fontWeight={600}>
              {rating}/5
            </Text>
          </HStack>
        </Box>

        {/* Comment Textarea */}
        <Box>
          <Text fontSize="sm" fontWeight={600} color="gray.600" mb={2}>
            Votre commentaire (optionnel)
          </Text>
          <Textarea 
            placeholder="Partagez votre expérience..." 
            value={comment} 
            onChange={(e) => setComment(e.target.value)}
            minH="120px"
            resize="vertical"
            borderRadius="lg"
            borderColor="gray.300"
            _hover={{ borderColor: 'gray.400' }}
            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
          />
        </Box>

        {/* Action Buttons */}
        <HStack spacing={3} pt={2}>
          <Button 
            colorScheme="brand" 
            onClick={submit} 
            isLoading={loading}
            flex={1}
            size="lg"
            borderRadius="lg"
            fontWeight={600}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            Publier l'avis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => { setComment(''); setRating(5) }}
            size="lg"
            borderRadius="lg"
            colorScheme="gray"
            _hover={{ bg: 'gray.50' }}
          >
            Effacer
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}