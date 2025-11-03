import React from 'react'
import { Box, Heading, Button, VStack, Text, useColorModeValue, useBreakpointValue, Image } from '@chakra-ui/react'

const HeroNike: React.FC = () => {
  const overlay = useColorModeValue('rgba(255,255,255,0.02)', 'rgba(0,0,0,0.6)')
  const showVideo = useBreakpointValue({ base: false, md: true })
  // fallback poster image (optimized for mobile)
  const poster = '/img/b.jfif'

  const scrollToProducts = () => {
    const el = document.getElementById('products-grid')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Box as="section" position="relative" h={{ base: '70vh', md: '90vh' }} w="100%" overflow="hidden">
      {/* Background video on desktop, static image on mobile for perf and UX */}
      {showVideo ? (
        <video
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
          <source src="https://res.cloudinary.com/dcs9vkwe0/video/upload/v1762000308/reels/3db55dbe-82af-40a8-9b9d-0e2b1dc26619/cz9gyqu95fdp15fq9x7f.mov" type="video/mp4" />
        </video>
      ) : (
        <Image
          src={poster}
          alt="Hero"
          objectFit="cover"
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          loading="eager"
          fallbackSrc={poster}
        />
      )}

      {/* subtle overlay to ensure text contrast */}
      <Box position="absolute" inset={0} bg={overlay} />

      <VStack position="relative" zIndex={2} h="100%" px={6} spacing={6} justify="center" align="center">
        <Heading as="h1" size={{ base: '2xl', md: '4xl' }} textAlign="center" maxW="container.md" color="white" fontWeight={800} letterSpacing={-1} lineHeight={0.9} fontFamily="Inter, system-ui">
          Exprime ton style
        </Heading>
        <Text color="whiteAlpha.850" maxW="container.md" textAlign="center" display={{ base: 'block', md: 'block' }} fontSize={{ base: 'md', md: 'lg' }}>
          Une sélection épurée, pensée pour l’émotion et la découverte.
        </Text>

        <Box position="absolute" bottom={{ base: 8, md: 12 }} zIndex={3}>
          <Button size="lg" bg="white" color="black" borderRadius="999px" onClick={scrollToProducts} px={6} py={3} fontWeight={800} boxShadow="lg">
            Découvrir
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}

export default HeroNike
