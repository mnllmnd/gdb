import React from 'react'
import { Box, Heading, Button, VStack, Text, useColorModeValue } from '@chakra-ui/react'

const HeroNike: React.FC = () => {
  const overlay = useColorModeValue('rgba(255,255,255,0.05)', 'rgba(0,0,0,0.45)')

  const scrollToProducts = () => {
    const el = document.getElementById('products-grid')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Box as="section" position="relative" h={{ base: '70vh', md: '90vh' }} w="100%" overflow="hidden">
      {/* Background video - fallback to poster if missing */}
      <video
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        autoPlay
        muted
        loop
        playsInline
        poster=""
      >
        <source src="https://res.cloudinary.com/dcs9vkwe0/video/upload/v1762000308/reels/3db55dbe-82af-40a8-9b9d-0e2b1dc26619/cz9gyqu95fdp15fq9x7f.mov" type="video/mp4" />
      </video>

      {/* subtle overlay to ensure text contrast */}
      <Box position="absolute" inset={0} bg={overlay} />

      <VStack position="relative" zIndex={2} h="100%" px={6} spacing={6} justify="center" align="center">
        <Heading as="h1" size={{ base: 'xl', md: '3xl' }} textAlign="center" maxW="container.md" color="white" fontWeight={700}>
          Exprime ton style
        </Heading>
        <Text color="whiteAlpha.800" maxW="container.md" textAlign="center" display={{ base: 'none', md: 'block' }}>
          Une sélection épurée, pensée pour l’émotion et la découverte.
        </Text>

        <Box position="absolute" bottom={{ base: 8, md: 12 }} zIndex={3}>
          <Button size="lg" colorScheme="blackAlpha" bg="white" color="black" borderRadius="full" onClick={scrollToProducts} px={8} py={6} fontWeight={700}>
            Découvrir maintenant
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}

export default HeroNike
