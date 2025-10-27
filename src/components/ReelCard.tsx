import React, { useRef, useState, useEffect } from 'react'
import { 
  Box, 
  HStack, 
  Icon, 
  Text, 
  Badge, 
  Flex, 
  Image, 
  VStack, 
  useToast, 
  Input, 
  Button, 
  IconButton,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Avatar
} from '@chakra-ui/react'
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShoppingBag, 
  FaPlay, 
  FaPause, 
  FaTrash, 
  FaVolumeMute, 
  FaVolumeUp,
  FaPaperPlane,
  FaTimes
} from 'react-icons/fa'
import { FiMoreHorizontal } from 'react-icons/fi'
import { getCurrentUser } from '../services/auth'
import api from '../services/api'

interface ReelCardProps {
  reel: {
    id: string
    cloudinary_url: string
    caption?: string
    product_title?: string
    shop_name?: string
    uploader_name?: string
    uploader_id?: string
    shop_logo?: string
    likes_count?: number
    comments_count?: number
    user_avatar?: string
    duration?: number
    created_at?: string
  }
  onOpen: (reel: any) => void
}

export default function ReelCard({ reel, onOpen }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const [isHover, setIsHover] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false) // 🔊 Son activé par défaut
  const [showPlayButton, setShowPlayButton] = useState(false)
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0)
  const [liked, setLiked] = useState(false)
  const [commentsCount, setCommentsCount] = useState(reel.comments_count || 0)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Gestion de la lecture vidéo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = isMuted

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    if (isHover && !isMobile) {
      video.loop = true
      video.play().catch(() => {})
      setShowPlayButton(true)
    } else if (!isHover && !isMobile) {
      video.pause()
      setIsPlaying(false)
      setShowPlayButton(false)
    }

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [isHover, isMuted, isMobile])

  // Observer pour la lecture automatique au scroll (mobile)
  useEffect(() => {
    if (!isMobile || !videoRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {})
            setIsPlaying(true)
          } else {
            videoRef.current?.pause()
            setIsPlaying(false)
          }
        })
      },
      { 
        threshold: 0.6
      }
    )

    observer.observe(videoRef.current)

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current)
      }
    }
  }, [isMobile])

  // Scroll vers le bas quand nouveau commentaire
  useEffect(() => {
    if (commentsEndRef.current && commentsOpen) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments, commentsOpen])

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMuted(!isMuted)
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }

  // Clic sur la vidéo - seulement play/pause sur mobile
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMobile) {
      togglePlay(e)
    } else {
      onOpen(reel)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    const user = getCurrentUser()
    if (!user) {
      toast({
        title: 'Connectez-vous',
        description: "Veuillez vous connecter pour liker ce reel.",
        status: 'info',
        duration: 3000,
      })
      return
    }
    
    const prevLiked = liked
    const prevCount = likesCount
    setLiked(!prevLiked)
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)

    ;(async () => {
      try {
        const res = await api.reels.like(reel.id)
        if (res && typeof res.liked !== 'undefined') setLiked(res.liked)
        if (res && typeof res.count !== 'undefined') setLikesCount(res.count)
      } catch (err) {
        setLiked(prevLiked)
        setLikesCount(prevCount)
        console.error('Failed to like reel', err)
      }
    })()
  }

  const openComments = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const user = getCurrentUser()
    if (!user) {
      toast({
        title: 'Connectez-vous',
        description: "Veuillez vous connecter pour commenter ce reel.",
        status: 'info',
        duration: 3000,
      })
      return
    }

    setCommentsOpen(true)
    if (comments.length === 0) {
      await loadComments()
    }
  }

  const loadComments = async () => {
    setIsLoadingComments(true)
    try {
      const commentsRes = await api.reels.getComments(reel.id)
      setComments(commentsRes.comments || [])
    } catch (err) {
      console.error('Failed to load comments', err)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commentaires',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  const submitComment = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const user = getCurrentUser()
    if (!user) {
      toast({ 
        title: 'Connectez-vous', 
        description: 'Veuillez vous connecter pour commenter ce reel.', 
        status: 'info', 
        duration: 3000 
      })
      return
    }
    
    const payload = commentText.trim()
    if (!payload) return

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
    setCommentsCount(prev => prev + 1)
    setCommentText('')
    
    try {
      await api.reels.comment(reel.id, { body: payload })
      // Recharger les commentaires pour avoir les vrais IDs
      await loadComments()
    } catch (err) {
      // Rollback
      setComments(prev => prev.filter(c => !c.id.startsWith('temp-')))
      setCommentsCount(prev => prev - 1)
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'envoyer le commentaire.', 
        status: 'error', 
        duration: 3000 
      })
      console.error('Failed to post comment', err)
    }
  }

  const handleShop = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Shop clicked for reel:', reel.id)
  }

  const user = getCurrentUser()
  const isOwner = user && String(user.id) === String(reel.uploader_id)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!globalThis.confirm('Supprimer ce reel ? Cette action est irréversible.')) return
    try {
      const token = globalThis.localStorage?.getItem('token') ?? undefined
      await api.reels.delete(reel.id, token)
      toast({ title: 'Reel supprimé', status: 'success' })
      if (typeof window !== 'undefined') window.location.reload()
    } catch (err: any) {
      console.error('Failed to delete reel', err)
      toast({ 
        title: 'Erreur', 
        description: err?.error || err?.message || 'Impossible de supprimer le reel', 
        status: 'error' 
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (hours < 1) return "À l'instant"
    if (hours < 24) return `Il y a ${hours}h`
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  // Composant pour la section commentaires
  const CommentsSection = () => (
    <Box height="100%" display="flex" flexDirection="column">
      <DrawerHeader borderBottomWidth="1px" p={4}>
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="lg">Commentaires</Text>
          <IconButton
            aria-label="Fermer"
            icon={<FaTimes />}
            variant="ghost"
            size="sm"
            onClick={() => setCommentsOpen(false)}
          />
        </HStack>
      </DrawerHeader>

      {/* Liste des commentaires */}
      <Box flex={1} overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {isLoadingComments ? (
            <Text textAlign="center" color="gray.500">
              Chargement des commentaires...
            </Text>
          ) : comments.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
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
          <div ref={commentsEndRef} />
        </VStack>
      </Box>

      {/* Input de commentaire */}
      <Box p={4} borderTop="1px solid" borderColor="gray.200">
        <HStack as="form" onSubmit={submitComment}>
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            borderRadius="full"
            bg="gray.50"
            border="none"
            size="sm"
          />
          <IconButton
            aria-label="Envoyer le commentaire"
            icon={<FaPaperPlane />}
            colorScheme="blue"
            size="sm"
            type="submit"
            isDisabled={!commentText.trim()}
          />
        </HStack>
      </Box>
    </Box>
  )

  return (
    <>
      <Box
        borderRadius="xl"
        overflow="hidden"
        bg="black"
        cursor="pointer"
        onClick={handleVideoClick}
        position="relative"
        _hover={{ 
          transform: isMobile ? 'none' : 'translateY(-8px)', 
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          shadow: isMobile ? 'lg' : '2xl'
        }}
        shadow="lg"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        {/* Video container */}
        <Box
          position="relative"
          height={{ base: '70vh', md: '360px' }}
          overflow="hidden"
          onMouseEnter={() => !isMobile && setIsHover(true)}
          onMouseLeave={() => !isMobile && setIsHover(false)}
        >
          {/* Gradient overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            background="linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.4) 100%)"
            zIndex={1}
            opacity={isHover ? 0.8 : 0.6}
            transition="opacity 0.3s ease"
          />

          {/* Video element */}
          <video
            ref={videoRef}
            src={reel.cloudinary_url}
            poster={reel.cloudinary_url}
            playsInline
            loop
            muted={isMuted}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              backgroundColor: 'black',
            }}
          />

          {/* Bouton son */}
          <Flex
            position="absolute"
            bottom={3}
            left={3}
            bg="blackAlpha.600"
            borderRadius="full"
            p={2}
            onClick={toggleMute}
            cursor="pointer"
            zIndex={5}
            _hover={{ bg: 'blackAlpha.800' }}
          >
            <Icon as={isMuted ? FaVolumeMute : FaVolumeUp} color="white" boxSize={3} />
          </Flex>

          {/* Play/Pause button overlay (desktop seulement) */}
          {!isMobile && showPlayButton && (
            <Flex
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              zIndex={3}
              onClick={togglePlay}
              bg="blackAlpha.600"
              borderRadius="full"
              p={3}
              backdropFilter="blur(10px)"
              opacity={isHover ? 1 : 0}
              transition="all 0.3s ease"
              _hover={{ bg: 'blackAlpha.800', transform: 'translate(-50%, -50%) scale(1.1)' }}
            >
              <Icon 
                as={isPlaying ? FaPause : FaPlay} 
                color="white" 
                boxSize={5}
              />
            </Flex>
          )}

          {/* Top bar avec shop et menu */}
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            zIndex={2}
            p={3}
            justify="space-between"
            align="center"
          >
            {/* Shop badge avec avatar */}
            {(reel.uploader_name || reel.shop_name) && (
              <Flex
                align="center"
                bg="blackAlpha.600"
                px={3}
                py={1.5}
                borderRadius="full"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
              >
                <Box
                  width={6}
                  height={6}
                  borderRadius="full"
                  bg="gray.300"
                  mr={2}
                  overflow="hidden"
                >
                  {(reel.shop_logo || reel.user_avatar) ? (
                    <Image 
                      src={reel.shop_logo || reel.user_avatar} 
                      alt={reel.uploader_name || reel.shop_name}
                      width="100%"
                      height="100%"
                      objectFit="cover"
                    />
                  ) : (
                    <Box bg="linear-gradient(135deg,#8b5cf6,#ec4899)" w="100%" h="100%" />
                  )}
                </Box>
                <Text 
                  color="white" 
                  fontSize="sm" 
                  fontWeight="semibold"
                  noOfLines={1}
                >
                  {reel.uploader_name || reel.shop_name}
                </Text>
              </Flex>
            )}

            {/* Menu button + delete for owner */}
            <Flex align="center" gap={2}>
              {!isMobile && (
                <Flex
                  bg="blackAlpha.600"
                  p={2}
                  borderRadius="full"
                  backdropFilter="blur(10px)"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _hover={{ bg: 'blackAlpha.800' }}
                >
                  <Icon as={FiMoreHorizontal} color="white" boxSize={4} />
                </Flex>
              )}

              {isOwner && (
                <IconButton
                  aria-label="Supprimer le reel"
                  icon={<FaTrash />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={handleDelete}
                  title="Supprimer"
                  _hover={{ bg: 'blackAlpha.800' }}
                />
              )}
            </Flex>
          </Flex>

          {/* Actions bar mobile - Design amélioré */}
          <VStack
            position="absolute"
            right={3}
            bottom={isMobile ? 16 : 4}
            spacing={3}
            color="white"
            zIndex={2}
            align="center"
          >
            {/* Like button avec compteur proche */}
            <Box textAlign="center">
              <IconButton
                aria-label="Aimer"
                icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                variant="ghost"
                onClick={handleLike}
                size="lg"
                color="white"
                _hover={{ bg: 'blackAlpha.300' }}
                mb={1}
              />
              <Text fontSize="xs" fontWeight="bold" lineHeight="1">
                {likesCount}
              </Text>
            </Box>

            {/* Comment button avec compteur proche */}
            <Box textAlign="center">
              <IconButton
                aria-label="Commenter"
                icon={<FaComment />}
                variant="ghost"
                onClick={openComments}
                size="lg"
                color="white"
                _hover={{ bg: 'blackAlpha.300' }}
                mb={1}
              />
              <Text fontSize="xs" fontWeight="bold" lineHeight="1">
                {commentsCount}
              </Text>
            </Box>

            {/* Shopping button */}
            <IconButton
              aria-label="Ajouter au panier"
              icon={<FaShoppingBag />}
              variant="ghost"
              onClick={handleShop}
              size="lg"
              color="white"
              _hover={{ bg: 'blackAlpha.300' }}
            />
          </VStack>

          {/* Caption mobile */}
          {isMobile && (
            <Box
              position="absolute"
              bottom={4}
              left={4}
              right={20} /* Réduit pour laisser de la place aux actions */
              zIndex={2}
            >
              <Text
                color="white"
                fontSize="sm"
                fontWeight="medium"
                noOfLines={2}
                textShadow="0 2px 4px rgba(0,0,0,0.5)"
              >
                {reel.caption || reel.product_title}
              </Text>
            </Box>
          )}
        </Box>

        {/* Footer (desktop seulement) */}
        {!isMobile && (
          <Box
            p={3}
            bg="white"
            borderTop="1px solid"
            borderColor="gray.100"
          >
            <HStack justify="space-between" align="center">
              <Text 
                fontSize="sm" 
                fontWeight="medium" 
                noOfLines={1}
                flex={1}
              >
                {reel.product_title}
              </Text>
              {reel.duration && (
                <Badge 
                  colorScheme="gray" 
                  variant="subtle"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {reel.duration}s
                </Badge>
              )}
            </HStack>
          </Box>
        )}
      </Box>

      {/* Drawer des commentaires (Mobile) */}
      <Drawer
        isOpen={commentsOpen}
        placement="bottom"
        onClose={() => setCommentsOpen(false)}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl" height="85vh">
          <CommentsSection />
        </DrawerContent>
      </Drawer>
    </>
  )
}