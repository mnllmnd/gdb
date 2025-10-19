import React from 'react'
import { Box, Image, Heading, Text, Stack, Button, useBreakpointValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'

export default function ShopCard({ shop }: Readonly<{ shop: Record<string, any> }>) {
  const cover = shop.logo_url || SHOP_PLACEHOLDER
  const hi = highRes(cover, { width: 800, quality: 85 }) ?? SHOP_PLACEHOLDER
  
  // Tailles adaptées: smaller on mobile so multiple cards are visible
  const cardHeight = useBreakpointValue({ base: '120px', md: '170px' })
  const logoSize = useBreakpointValue({ base: '44px', sm: '56px' })
  const headingSize = useBreakpointValue({ base: 'sm', sm: 'md' })

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="xl" 
      overflow="hidden" 
      bg="white" 
      boxShadow="0 2px 8px rgba(0,0,0,0.08)" 
      transition="all 250ms ease-in-out" 
      _hover={{ 
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
        transform: 'translateY(-2px)'
      }}
      position="relative"
      maxW="420px" // Légèrement plus large
      mx="auto"
      height="100%" // Prend toute la hauteur disponible
    >
      {/* Image de couverture avec overlay gradient */}
      <Box 
        height={cardHeight} 
        bg="gray.100" 
        overflow="hidden" 
        position="relative"
      >
        <Image 
          src={hi} 
          alt={shop.name || shop.domain} 
          objectFit="cover" 
          width="100%" 
          height="100%"
          onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
          loading="lazy"
        />
        {/* Overlay gradient pour meilleur contraste */}
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height="40%"
          bgGradient="linear(to-t, blackAlpha.200, transparent)"
        />
      </Box>
      
      {/* Contenu avec plus d'espace */}
      <Box p={{ base: 4, sm: 5 }} flex="1" display="flex" flexDirection="column">
        <Stack 
          spacing={3} 
          direction="row" 
          align="flex-start"
          position="relative"
          flex="1"
        >
          {/* Logo avec effet de carte - position ajustée */}
          <Box 
            position="relative"
            mt={`-${useBreakpointValue({ base: '32px', sm: '36px' })}`}
            flexShrink={0}
          >
            <Image 
              src={highRes(cover, { width: 160, quality: 85 }) ?? SHOP_PLACEHOLDER} 
              alt="logo" 
              boxSize={logoSize}
              objectFit="cover" 
              borderRadius="xl"
              onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
              borderWidth="3px"
              borderColor="white"
              boxShadow="0 4px 12px rgba(0,0,0,0.15)"
              bg="white"
            />
          </Box>
          
          {/* Texte avec plus d'espace */}
          <Box flex="1" minW="0" pt={1}>
            <Heading 
              size={headingSize} 
              noOfLines={2}
              fontWeight="600"
              color="gray.800"
              lineHeight="1.3"
              mb={2}
            >
              {shop.name || shop.domain}
            </Heading>
            <Text 
              color="gray.600" 
              noOfLines={3} // Une ligne de plus pour la description
              fontSize="sm" // Légèrement plus grand
              lineHeight="1.4"
            >
              {shop.description || 'Boutique locale de qualité'}
            </Text>
          </Box>
        </Stack>
        
        {/* Bouton avec plus d'espace au-dessus */}
        <Button 
          as={RouterLink} 
          to={`/shop/${encodeURIComponent(shop.domain || shop.id)}`} 
          colorScheme="brand" 
          size="md" // Taille medium pour plus de présence
          mt={5} // Plus d'espace
          width="100%"
          borderRadius="lg"
          fontWeight="500"
          boxShadow="0 2px 6px rgba(0,0,0,0.1)"
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          transition="all 200ms ease"
        >
          Visiter la boutique
        </Button>
      </Box>
    </Box>
  )
}