import React from 'react'
import { Modal, ModalOverlay, ModalContent, ModalBody, ModalFooter, Button, HStack, Icon, Text, VStack, Box, useToast } from '@chakra-ui/react'
import { FaHeart, FaRegHeart, FaComment, FaCartPlus } from 'react-icons/fa'
import api from '../services/api'
import cart from '../utils/cart'
import { getCurrentUser } from '../services/auth'

export default function ReelPlayer({ reel, isOpen, onClose, onLiked }: any) {
  const toast = useToast()
  const [liked, setLiked] = React.useState(false)
  const [likesCount, setLikesCount] = React.useState(reel.likes_count || 0)

  React.useEffect(() => {
    // fetch initial liked state (simple)
    let mounted = true
    ;(async () => {
      try {
        const res = await api.reels.get(reel.id)
        if (!mounted) return
        setLikesCount(res.likes || 0)
      } catch (err) {}
    })()
    return () => { mounted = false }
  }, [reel.id])

  async function toggleLike() {
    const user = getCurrentUser()
    if (!user) {
      toast({ title: 'Connectez-vous', description: 'Veuillez vous connecter pour liker ce reel.', status: 'info', duration: 3000 })
      const next = (typeof window !== 'undefined') ? window.location.pathname + window.location.search : '/'
      window.location.href = `/login?next=${encodeURIComponent(next)}`
      return
    }
    // Optimistic UI: update immediately, rollback if request fails
    const prevLiked = liked
    const prevCount = likesCount
    try {
      setLiked(!prevLiked)
      setLikesCount(prevLiked ? Math.max(0, (prevCount || 0) - 1) : (prevCount || 0) + 1)
      const res = await api.reels.like(reel.id)
      // use server response to reconcile
      setLiked(res.liked)
      setLikesCount(res.count)
      if (onLiked) onLiked()
    } catch (err) {
      console.error('Failed like', err)
      // rollback
      setLiked(prevLiked)
      setLikesCount(prevCount)
    }
  }

  function addProductToCart() {
    // optimistic: add product to cart
    cart.add({ id: reel.product_id, title: reel.product_title, price: 0 }, 1)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent bg="black">
        <ModalBody p={0}>
          {/* Vertical video player placeholder. Replace with <video> tag or Cloudinary player. */}
          <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
            <video src={reel.cloudinary_url} style={{ maxHeight: '100%', width: 'auto' }} controls autoPlay muted playsInline />
          </Box>
        </ModalBody>
        <ModalFooter>
          <VStack align="stretch" spacing={2} width="100%">
            {/* Uploader info (like Instagram) */}
            <HStack justify="space-between">
              <HStack spacing={3} align="center">
                <Box width={10} height={10} borderRadius="full" overflow="hidden" bg="gray.200">
                  {reel.shop_logo ? (
                    <img src={reel.shop_logo} alt={reel.uploader_name || reel.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </Box>
                <VStack spacing={0} align="start">
                  <Text fontWeight="700">{reel.uploader_name || reel.shop_name}</Text>
                  <Text fontSize="sm" color="gray.300">{reel.shop_name}</Text>
                </VStack>
              </HStack>
            </HStack>
            <HStack justify="space-between">
              <HStack spacing={4}>
                <Button onClick={toggleLike} leftIcon={<Icon as={liked ? FaHeart : FaRegHeart} />}>
                  {likesCount}
                </Button>
                <Button leftIcon={<FaComment />} onClick={() => {
                  const user = getCurrentUser()
                  if (!user) {
                    toast({ title: 'Connectez-vous', description: 'Veuillez vous connecter pour commenter ce reel.', status: 'info', duration: 3000 })
                    const next = (typeof window !== 'undefined') ? window.location.pathname + window.location.search : '/'
                    window.location.href = `/login?next=${encodeURIComponent(next)}`
                    return
                  }
                  // TODO: open comment UI
                }}>Comment</Button>
              </HStack>
              <HStack>
                <Button onClick={() => { addProductToCart(); if (onClose) onClose() }} leftIcon={<FaCartPlus />}>Ajouter au panier</Button>
              </HStack>
            </HStack>
            <Text color="white">{reel.caption}</Text>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
