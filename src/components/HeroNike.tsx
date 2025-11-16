import React, { useEffect, useState } from 'react'
import { Box, VStack, Heading, Text, Button, Image, useColorModeValue, HStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const HeroNike: React.FC = () => {
  const overlay = useColorModeValue('rgba(255,255,255,0.02)', 'rgba(0,0,0,0.6)')

  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>([])
  const [desktopSet, setDesktopSet] = useState(0)
  const [images, setImages] = useState<string[]>([])

  const navigate = useNavigate()

  // Load real product images (use first available image per product)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const list = await api.products.list()
        if (!mounted) return
        const imgs: string[] = []
        for (const p of (list || []).slice(0, 6)) {
          const candidate = (Array.isArray(p.images) && p.images.length && p.images[0]) || p.image_url || p.product_image || null
          if (candidate) imgs.push(String(candidate))
          if (imgs.length >= 3) break
        }
        if (imgs.length > 0) {
          setImages(imgs)
          setLoaded(Array(imgs.length).fill(false))
        } else {
          // fallback static images
          const fallback = [
            'https://i.pinimg.com/1200x/5e/f9/2d/5ef92d7eb931c6f4cbce5568e7d20052.jpg',
            'https://i.pinimg.com/1200x/f4/88/35/f488355a53b9431cf31a3f8492a77031.jpg',
            'https://i.pinimg.com/736x/cd/f3/5d/cdf35d0ef6b1e520acc76abcdfe728aa.jpg',
          ]
          setImages(fallback)
          setLoaded(Array(fallback.length).fill(false))
        }
      } catch (err) {
        const fallback = [
          'https://i.pinimg.com/1200x/5e/f9/2d/5ef92d7eb931c6f4cbce5568e7d20052.jpg',
          'https://i.pinimg.com/1200x/f4/88/35/f488355a53b9431cf31a3f8492a77031.jpg',
          'https://i.pinimg.com/736x/cd/f3/5d/cdf35d0ef6b1e520acc76abcdfe728aa.jpg',
        ]
        if (mounted) {
          setImages(fallback)
          setLoaded(Array(fallback.length).fill(false))
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Précharger les images
  useEffect(() => {
    if (!images || !images.length) return
    images.forEach((src, idx) => {
      const img = new window.Image()
      img.src = src
      img.onload = () =>
        setLoaded(prev => {
          const copy = [...prev]
          copy[idx] = true
          return copy
        })
      img.onerror = () =>
        setLoaded(prev => {
          const copy = [...prev]
          copy[idx] = true
          return copy
        })
    })
  }, [images])

  // Changement d'image mobile
  useEffect(() => {
    if (!images || images.length === 0) return
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [images])

  // Changement de set desktop (rotate)
  useEffect(() => {
    if (!images || images.length === 0) return
    const interval = setInterval(() => {
      setDesktopSet(prev => (prev + 1) % 2)
    }, 3000)
    return () => clearInterval(interval)
  }, [images])

  const goToProducts = () => {
    try {
      navigate('/products')
    } catch (e) {
      const el = document.getElementById('products-grid')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!images.length) return null
  if (!loaded.every(l => l)) return null

  // Deux sets d'images pour desktop (safe fallbacks)
  const desktopSets = [
    [images[0], images[1] || images[0], images[2] || images[0]],
    [images[2] || images[0], images[0], images[1] || images[0]],
  ]

  const headingColor = useColorModeValue('black', 'white')
  const textColor = useColorModeValue('gray.800', 'gray.200')
  const ctaBg = useColorModeValue('white', 'black')
  const ctaColor = useColorModeValue('black', 'white')
  const ctaHover = useColorModeValue('gray.100', 'gray.600')

  return (
    <Box as="section" position="relative" h={{ base: '70vh', md: '90vh' }} w="100%" overflow="hidden">
      {/* Desktop : fade entre deux sets de 3 images */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="relative"
        w="100%"
        h="100%"
      >
        {desktopSets.map((imageSet, setIdx) => (
          <HStack
            key={setIdx}
            spacing={0}
            w="100%"
            h="100%"
            position="absolute"
            top={0}
            left={0}
          >
            {imageSet.map((img, idx) => (
              <Box
                key={`${setIdx}-${idx}`}
                minW="33.33%"
                h="100%"
                flex="0 0 auto"
                position="relative"
                overflow="hidden"
              >
                <Image
                  src={img}
                  alt={`Look ${idx}`}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                  transition="transform 8s ease-out"
                  transform={setIdx === desktopSet ? 'scale(1.1)' : 'scale(1)'}
                  _hover={{ transform: 'scale(1.15) !important' }}
                />
              </Box>
            ))}
          </HStack>
        ))}
      </Box>

      {/* Mobile : fade entre les images */}
      {images.map((img, idx) => (
        <Image
          key={idx}
          src={img}
          alt={`Hero ${idx}`}
          objectFit="cover"
          objectPosition="center"
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          transition="opacity 1.2s ease-in-out"
          opacity={idx === index ? 1 : 0}
          display={{ base: 'block', md: 'none' }}
        />
      ))}

      {/* Overlay */}
      <Box position="absolute" inset={0} bg={overlay} zIndex={1} />

      {/* Contenu centré */}
      <VStack
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        zIndex={2}
        px={6}
        spacing={6}
        justify="center"
        align="center"
      >
        <Text
          color="white"
          maxW="container.md"
          textAlign="center"
          fontSize={{ base: 'md', md: 'lg' }}
        >
          African Style
        </Text>

        <Box position="absolute" bottom={{ base: 8, md: 12 }}>
          <Button
            size="lg"
            bg={ctaBg}
            color={ctaColor}
            borderRadius="999px"
            onClick={goToProducts}
            px={6}
            py={3}
            fontWeight={800}
            boxShadow="lg"
            _hover={{ bg: ctaHover }}
          >
            Découvrir
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}

export default HeroNike

