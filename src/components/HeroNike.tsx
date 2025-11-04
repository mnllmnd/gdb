import React, { useEffect, useState } from 'react'
import { Box, VStack, Heading, Text, Button, Image, useColorModeValue, HStack } from '@chakra-ui/react'

const HeroNike: React.FC = () => {
  const overlay = useColorModeValue('rgba(255,255,255,0.02)', 'rgba(0,0,0,0.6)')

  const images: string[] = [
    'https://i.pinimg.com/1200x/9e/6d/ca/9e6dcaaee3f8d5e80e9a32ebf14f1a5a.jpg',
    'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761999319/gestion_de_boutique/mghjkzerwo2spwmobzaf.jpg',
  ]

  const [swap, setSwap] = useState(false)
  const [loaded, setLoaded] = useState<boolean[]>(Array(images.length).fill(false))

  // Précharger les images
  useEffect(() => {
    images.forEach((src, idx) => {
      const img = new window.Image()
      img.src = src
      img.onload = () => setLoaded(prev => {
        const copy = [...prev]
        copy[idx] = true
        return copy
      })
    })
  }, [images])

  // Swap toutes les 5s
  useEffect(() => {
    const interval = setInterval(() => setSwap(prev => !prev), 5000)
    return () => clearInterval(interval)
  }, [])

  const scrollToProducts = () => {
    const el = document.getElementById('products-grid')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  // Si images pas encore chargées
  if (!loaded.every(l => l)) return null

  return (
    <Box as="section" position="relative" h={{ base: '70vh', md: '90vh' }} w="100%" overflow="hidden">
      
      {/* Desktop : deux images côte à côte, swap smooth */}
      <HStack display={{ base: 'none', md: 'flex' }} w="100%" h="100%" spacing={0} overflow="hidden">
        {images.map((img, idx) => (
          <Image
            key={idx}
            src={img}
            alt={`Hero ${idx}`}
            width="50%"
            height="100%"
            objectFit="cover"
            objectPosition="center"
            position="relative"
            transition="transform 1s ease-in-out"
            transform={swap ? (idx === 0 ? 'translateX(-2%)' : 'translateX(2%)') : 'translateX(0%)'}
          />
        ))}
      </HStack>

      {/* Mobile : cross-fade */}
      {images.map((img, idx) => {
        const opacity = swap ? (idx === 0 ? 0 : 1) : idx === 0 ? 1 : 0
        return (
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
            transition="opacity 1s ease-in-out"
            opacity={opacity}
            display={{ base: 'block', md: 'none' }}
          />
        )
      })}

      {/* Overlay */}
      <Box position="absolute" inset={0} bg={overlay} zIndex={1} />

      {/* Contenu */}
      <VStack position="relative" zIndex={2} h="100%" px={6} spacing={6} justify="center" align="center">
        <Heading
          as="h1"
          size={{ base: '2xl', md: '4xl' }}
          textAlign="center"
          maxW="container.md"
          color="white"
          fontWeight={800}
          letterSpacing={-1}
          lineHeight={0.9}
          fontFamily="Inter, system-ui"
        >
          Style
        </Heading>
        <Text color="white" maxW="container.md" textAlign="center" fontSize={{ base: 'md', md: 'lg' }}>
          Une sélection épurée, pensée pour l’émotion et la découverte.
        </Text>

        <Box position="absolute" bottom={{ base: 8, md: 12 }}>
          <Button
            size="lg"
            bg="white"
            color="black"
            borderRadius="999px"
            onClick={scrollToProducts}
            px={6}
            py={3}
            fontWeight={800}
            boxShadow="lg"
            _hover={{ bg: 'gray.100' }}
          >
            Découvrir
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}

export default HeroNike
