import React from 'react'
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalBody, 
  ModalCloseButton,
  VStack, 
  HStack, 
  Text, 
  Box, 
  IconButton,
  Avatar,
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  useToast,
  Flex,
  Divider
} from '@chakra-ui/react'
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShoppingBag, 
  FaPaperPlane,
  FaTimes,
  FaPlay,
  FaPause
} from 'react-icons/fa'
import api from '../services/api'
import cart from '../utils/cart'
import { getCurrentUser } from '../services/auth'

export default function ReelPlayer({ reel, isOpen, onClose, onLiked }: any) {
  const toast = useToast()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = React.useState(false)
  const [likesCount, setLikesCount] = React.useState(reel.likes_count || 0)
  const [commentText, setCommentText] = React.useState('')
  const [comments, setComments] = React.useState<any[]>([])
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [sellerId, setSellerId] = React.useState<string | null>(null)
  const commentsContainerRef = React.useRef<HTMLDivElement | null>(null)
  const commentInputRef = React.useRef<HTMLInputElement | null>(null)

  // Charger les données initiales
  React.useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      try {
        // Charger les infos du reel
  const res = await api.reels.get(reel.id)
  if (!mounted) return
  setLikesCount(res.likes || 0)
  setLiked(res.user_has_liked || false)
  // if server returned reel metadata, capture seller id for permission checks
  if (res && res.reel && res.reel.seller_id) setSellerId(String(res.reel.seller_id))
        
        // Charger les commentaires
        setIsLoadingComments(true)
        const commentsRes = await api.reels.getComments(reel.id)
        if (mounted) {
          setComments(commentsRes.comments || [])
        }
      } catch (err) {
        console.error('Failed to load reel data', err)
      } finally {
        if (mounted) setIsLoadingComments(false)
      }
    }
    
    if (isOpen) {
      loadData()
    }
    
    return () => { mounted = false }
  }, [reel.id, isOpen])

  // Gestion de la lecture vidéo
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isOpen && isPlaying) {
      video.play().catch(console.error)
    } else {
      video.pause()
    }

    return () => {
      video.pause()
    }
  }, [isOpen, isPlaying])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    togglePlay()
  }

  async function toggleLike() {
    const user = getCurrentUser()
    if (!user) {
      toast({ 
        title: 'Connexion requise', 
        description: 'Connectez-vous pour aimer ce reel.', 
        status: 'info', 
        duration: 3000 
      })
      return
    }

    const prevLiked = liked
    const prevCount = likesCount
    
    try {
      setLiked(!prevLiked)
      setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)
      
      const res = await api.reels.like(reel.id)
      setLiked(res.liked)
      setLikesCount(res.count)
      if (onLiked) onLiked()
    } catch (err) {
      console.error('Failed like', err)
      setLiked(prevLiked)
      setLikesCount(prevCount)
    }
  }

  async function submitComment() {
    const user = getCurrentUser()
    if (!user) {
      toast({ 
        title: 'Connexion requise', 
        description: 'Connectez-vous pour commenter.', 
        status: 'info', 
        duration: 3000 
      })
      return
    }

    const payload = commentText.trim()
    if (!payload) return

    try {
      const newComment = {
        id: `temp-${Date.now()}`,
        body: payload,
        user: {
          name: user.name || 'Vous',
          avatar: user.avatar
        },
        created_at: new Date().toISOString()
      }

      // Optimistic update
      setComments(prev => [newComment, ...prev])
      setCommentText('')

      await api.reels.comment(reel.id, { body: payload })
      
      // Recharger les commentaires pour avoir les vrais IDs
      const commentsRes = await api.reels.getComments(reel.id)
      setComments(commentsRes.comments || [])
      
      if (onLiked) onLiked()
    } catch (err) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'envoyer le commentaire.', 
        status: 'error', 
        duration: 3000 
      })
      // Rollback
      setComments(prev => prev.filter(c => !c.id.startsWith('temp-')))
    }
  }

  function addProductToCart() {
    cart.add({ 
      id: reel.product_id, 
      title: reel.product_title, 
      price: reel.product_price || 0 
    }, 1)
    toast({
      title: 'Ajouté au panier',
      description: reel.product_title,
      status: 'success',
      duration: 2000
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent 
        bg="black" 
        maxW="100vw" 
        maxH="100vh" 
        borderRadius="0"
        margin="0"
      >
        <ModalCloseButton 
          zIndex={10} 
          color="white" 
          size="lg" 
          top={4} 
          right={4}
          bg="blackAlpha.500"
          _hover={{ bg: 'blackAlpha.700' }}
        />
        
        <ModalBody p={0} display="flex">
          {/* Section Vidéo */}
          <Box 
            flex="1" 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            position="relative"
            bg="black"
            onClick={handleVideoClick}
            cursor="pointer"
          >
            <video
              ref={videoRef}
              src={reel.cloudinary_url}
              style={{ 
                maxHeight: '100vh', 
                maxWidth: '100%', 
                objectFit: 'contain' 
              }}
              muted
              loop
              playsInline
              autoPlay
            />
            
            {/* Overlay de contrôle play/pause */}
            {!isPlaying && (
              <Flex
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="blackAlpha.600"
                borderRadius="full"
                p={6}
                backdropFilter="blur(10px)"
              >
                <Icon as={FaPlay} color="white" boxSize={8} />
              </Flex>
            )}
          </Box>

          {/* Section Informations (Commentaires, Likes, etc.) */}
          <Box 
            width="400px" 
            bg="white" 
            display="flex" 
            flexDirection="column"
            maxH="100vh"
          >
            {/* En-tête avec infos du shop */}
            <Box p={4} borderBottom="1px solid" borderColor="gray.100">
              <HStack spacing={3}>
                <Avatar 
                  size="md" 
                  src={reel.shop_logo} 
                  name={reel.shop_name}
                />
                <VStack spacing={0} align="start" flex={1}>
                  <Text fontWeight="bold" fontSize="md">
                    {reel.shop_name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {reel.uploader_name}
                  </Text>
                </VStack>
                <IconButton
                  aria-label="Ajouter au panier"
                  icon={<FaShoppingBag />}
                  variant="ghost"
                  colorScheme="blue"
                  onClick={addProductToCart}
                />
                {/* Delete button visible to uploader or admin */}
                {(() => {
                  try {
                    const user = getCurrentUser()
                    if (user && (String(user.id) === String(reel.uploader_id) || String(user.id) === String(sellerId) || user.role === 'admin')) {
                      return (
                        <IconButton
                          aria-label="Supprimer le reel"
                          icon={<FaTimes />}
                          variant="ghost"
                          colorScheme="red"
                          onClick={async () => {
                            const ok = window.confirm('Supprimer ce reel ? Cette action est irréversible.')
                            if (!ok) return
                            try {
                              await api.reels.delete(reel.id)
                              toast({ title: 'Reel supprimé', status: 'success', duration: 2000 })
                              if (onLiked) onLiked()
                              if (onClose) onClose()
                            } catch (err) {
                              console.error('Failed delete', err)
                              toast({ title: 'Erreur', description: 'Impossible de supprimer le reel.', status: 'error', duration: 3000 })
                            }
                          }}
                        />
                      )
                    }
                  } catch (e) {
                    return null
                  }
                  return null
                })()}
              </HStack>
            </Box>

            {/* Caption */}
            {reel.caption && (
              <Box p={4} borderBottom="1px solid" borderColor="gray.100">
                <HStack spacing={3} align="start">
                  <Avatar 
                    size="sm" 
                    src={reel.shop_logo} 
                    name={reel.shop_name}
                  />
                  <Box flex={1}>
                    <Text fontSize="sm">
                      <Text as="span" fontWeight="bold" mr={2}>
                        {reel.shop_name}
                      </Text>
                      {reel.caption}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {formatTime(reel.created_at)}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}

            {/* Liste des commentaires */}
            <Box ref={(el) => { commentsContainerRef.current = el }} flex={1} overflowY="auto" p={4}>
              <VStack spacing={4} align="stretch">
                {isLoadingComments ? (
                  <Text textAlign="center" color="gray.500">
                    Chargement des commentaires...
                  </Text>
                ) : comments.length === 0 ? (
                  <Text textAlign="center" color="gray.500">
                    Soyez le premier à commenter
                  </Text>
                ) : (
                  comments.map((comment) => (
                    <HStack key={comment.id} spacing={3} align="start">
                      <Avatar 
                        size="sm" 
                        src={comment.user?.avatar} 
                        name={comment.user?.name}
                      />
                      <Box flex={1}>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="bold" mr={2}>
                            {comment.user?.name}
                          </Text>
                          {comment.body}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {formatTime(comment.created_at)}
                        </Text>
                      </Box>
                    </HStack>
                  ))
                )}
              </VStack>
            </Box>

            {/* Actions et input de commentaire */}
            <Box p={4} borderTop="1px solid" borderColor="gray.100">
              {/* Actions (Like, Comment) */}
              <HStack spacing={4} mb={3}>
                <IconButton
                  aria-label="Aimer"
                  icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                  variant="ghost"
                  onClick={toggleLike}
                  size="lg"
                />
                <IconButton
                  aria-label="Commenter"
                  icon={<FaComment />}
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    try {
                      const container = commentsContainerRef.current
                      const input = commentInputRef.current
                      if (container) {
                        container.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                      setTimeout(() => { if (input) input.focus() }, 200)
                    } catch (e) {
                      // ignore
                    }
                  }}
                />
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  {likesCount} j'aime
                </Text>
              </HStack>

              {/* Input de commentaire */}
              <InputGroup size="md">
                <Input
                  ref={(el) => { commentInputRef.current = el }}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  borderRadius="full"
                  bg="gray.50"
                  border="none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitComment()
                    }
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Envoyer le commentaire"
                    icon={<FaPaperPlane />}
                    variant="ghost"
                    colorScheme="blue"
                    size="sm"
                    isDisabled={!commentText.trim()}
                    onClick={submitComment}
                  />
                </InputRightElement>
              </InputGroup>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}