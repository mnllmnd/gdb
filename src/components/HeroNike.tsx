import React, { useEffect, useState } from 'react'
import { Box, VStack, Heading, Text, Button, Image, useColorModeValue } from '@chakra-ui/react'

const HeroNike: React.FC = () => {
  const overlay = useColorModeValue('rgba(255,255,255,0.02)', 'rgba(0,0,0,0.6)')

  const images = [
    'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761999319/gestion_de_boutique/p9lmfjsu5vjn8bxzqgwo.jpg',
    'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761999319/gestion_de_boutique/mghjkzerwo2spwmobzaf.jpg',
  ]

  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState(1)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false) // fade out current
      setTimeout(() => {
        setCurrent(next)
        setNext((next + 1) % images.length)
        setFade(true) // fade in new
      }, 1000) // durée fade-out
    }, 5000)
    return () => clearInterval(interval)
  }, [next])

  const scrollToProducts = () => {
    const el = document.getElementById('products-grid')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Box as="section" position="relative" h={{ base: '70vh', md: '90vh' }} w="100%" overflow="hidden">
      {/* Cross-fade images */}
      {images.map((img, idx) => {
        let opacity = 0
        if (idx === current) opacity = fade ? 1 : 0
        if (idx === next) opacity = fade ? 0 : 1
        return (
          <Image
            key={idx}
            src={img}
            alt={`Hero ${idx}`}
            objectFit="cover"
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            transition="opacity 1s ease-in-out"
            opacity={opacity}
          />
        )
      })}

      {/* Overlay */}
      <Box position="absolute" inset={0} bg={overlay} />

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
