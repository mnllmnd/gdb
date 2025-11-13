import React, { useEffect, useState } from 'react'
import { Box, VStack, Heading, Text, Button, Image, useColorModeValue, HStack } from '@chakra-ui/react'

const HeroNike: React.FC = () => {
  const overlay = useColorModeValue('rgba(255,255,255,0.02)', 'rgba(0,0,0,0.6)')

  const images: string[] = [
    'https://i.pinimg.com/1200x/3b/10/76/3b1076217593cd705e39ccc268fe489c.jpg',
    'https://i.pinimg.com/1200x/f4/88/35/f488355a53b9431cf31a3f8492a77031.jpg',
    'https://i.pinimg.com/736x/cd/f3/5d/cdf35d0ef6b1e520acc76abcdfe728aa.jpg',
  ]

  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>(Array(images.length).fill(false))
  const [desktopSet, setDesktopSet] = useState(0)

  // Précharger les images
  useEffect(() => {
    images.forEach((src, idx) => {
      const img = new window.Image()
      img.src = src
      img.onload = () =>
        setLoaded(prev => {
          const copy = [...prev]
          copy[idx] = true
          return copy
        })
    })
  }, [])

  // Changement d'image mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Changement de set desktop (3 nouvelles images toutes les 6 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      setDesktopSet(prev => (prev + 1) % 2) // Alterne entre 2 sets d'images
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const scrollToProducts = () => {
    const el = document.getElementById('products-grid')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  if (!loaded.every(l => l)) return null

  // Deux sets d'images pour desktop
  const desktopSets = [
    [images[0], images[1], images[2]],
    [images[2], images[0], images[1]], // Rotation des images
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
            onClick={scrollToProducts}
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

