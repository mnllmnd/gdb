import React, { useRef, useState, useEffect } from 'react'
import { Box, HStack, Icon, Text, Badge, Flex, Image, VStack, useToast } from '@chakra-ui/react'
import { FaHeart, FaComment, FaShoppingBag, FaPlay, FaPause } from 'react-icons/fa'
import { FiMoreHorizontal } from 'react-icons/fi'
import { getCurrentUser } from '../services/auth'

interface ReelCardProps {
  reel: {
    id: string
    cloudinary_url: string
    caption?: string
    product_title?: string
    shop_name?: string
    // uploader/shop metadata (may come from server)
    uploader_name?: string
    uploader_id?: string
    shop_logo?: string
    likes_count?: number
    comments_count?: number
    user_avatar?: string
    duration?: number
  }
  onOpen: (reel: any) => void
}

export default function ReelCard({ reel, onOpen }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHover, setIsHover] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(false)
  const toast = useToast()

  // Lecture automatique au hover
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    if (isHover) {
      video.muted = true
      video.loop = true
      video.play().catch(() => {})
      setShowPlayButton(true)
    } else {
      video.pause()
      video.currentTime = 0
      setIsPlaying(false)
      setShowPlayButton(false)
    }

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [isHover])

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
      const next = (typeof window !== 'undefined') ? window.location.pathname + window.location.search : '/'
      window.location.href = `/login?next=${encodeURIComponent(next)}`
      return
    }

    // Logique pour liker (utilisateur connecté)
    console.log('Like clicked for reel:', reel.id)
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    const user = getCurrentUser()
    if (!user) {
      toast({
        title: 'Connectez-vous',
        description: "Veuillez vous connecter pour commenter ce reel.",
        status: 'info',
        duration: 3000,
      })
      const next = (typeof window !== 'undefined') ? window.location.pathname + window.location.search : '/'
      window.location.href = `/login?next=${encodeURIComponent(next)}`
      return
    }

    // Logique pour commenter (utilisateur connecté)
    console.log('Comment clicked for reel:', reel.id)
  }

  const handleShop = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Logique pour shopping
    console.log('Shop clicked for reel:', reel.id)
  }

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      bg="black"
      cursor="pointer"
      onClick={() => onOpen(reel)}
      position="relative"
      _hover={{ 
        transform: 'translateY(-8px)', 
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        shadow: '2xl'
      }}
      shadow="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      {/* Video container avec overlay gradient */}
      <Box
        position="relative"
        height={{ base: '300px', md: '360px' }}
        overflow="hidden"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        {/* Gradient overlay pour un effet plus esthétique */}
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

        {/* Video element - moins zoomé */}
        <video
          ref={videoRef}
          src={reel.cloudinary_url}
          poster={reel.cloudinary_url}
          playsInline
          muted
          loop
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Moins zoomé que 'cover'
            display: 'block',
            backgroundColor: 'black',
          }}
        />

        {/* Play/Pause button overlay */}
        {showPlayButton && (
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

          {/* Menu button */}
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
        </Flex>

        {/* Bottom actions bar */}
        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          zIndex={2}
          p={4}
          justify="space-between"
          align="flex-end"
        >
          {/* Caption */}
          <Text
            color="white"
            fontSize="sm"
            fontWeight="medium"
            noOfLines={2}
            flex={1}
            mr={3}
            textShadow="0 2px 4px rgba(0,0,0,0.5)"
          >
            {reel.caption || reel.product_title}
          </Text>

          {/* Action buttons - VStack corrigé */}
          <VStack spacing={2} align="center">
            {/* Like button */}
            <Box 
              onClick={handleLike}
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            >
              <Flex
                bg="blackAlpha.600"
                p={2}
                borderRadius="full"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                mb={1}
              >
                <Icon as={FaHeart} color="white" boxSize={4} />
              </Flex>
              <Text color="white" fontSize="xs" fontWeight="medium" textAlign="center">
                {reel.likes_count || 0}
              </Text>
            </Box>

            {/* Comment button */}
            <Box 
              onClick={handleComment}
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            >
              <Flex
                bg="blackAlpha.600"
                p={2}
                borderRadius="full"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                mb={1}
              >
                <Icon as={FaComment} color="white" boxSize={4} />
              </Flex>
              <Text color="white" fontSize="xs" fontWeight="medium" textAlign="center">
                {reel.comments_count || 0}
              </Text>
            </Box>

            {/* Shopping button */}
            <Box 
              onClick={handleShop}
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            >
              <Flex
                bg="linear-gradient(135deg, #FF6B6B, #EE5A24)"
                p={2}
                borderRadius="full"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                mb={1}
              >
                <Icon as={FaShoppingBag} color="white" boxSize={4} />
              </Flex>
            </Box>
          </VStack>
        </Flex>
      </Box>

      {/* Footer minimaliste */}
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
    </Box>
  )
}