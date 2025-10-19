import React from 'react'
import { Box, Image, Heading, Text, Stack, Button, useBreakpointValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'

export default function ShopCard({ shop, compact = false }: Readonly<{ shop: Record<string, any>, compact?: boolean }>) {
  const cover = shop.logo_url || SHOP_PLACEHOLDER
  const hi = highRes(cover, { width: 400, quality: 80 }) ?? SHOP_PLACEHOLDER
  
  // Tailles ultra-compactes pour affichage côte à côte
  const cardHeight = useBreakpointValue({ 
    base: '70px', 
    sm: '80px',
    md: '120px' 
  })
  const logoSize = useBreakpointValue({ 
    base: '28px', 
    sm: '32px',
    md: '40px' 
  })

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="md" 
      overflow="hidden" 
      bg="white" 
      boxShadow="0 1px 2px rgba(0,0,0,0.06)" 
      transition="all 150ms ease-in-out" 
      _hover={{ 
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)', 
        transform: 'translateY(-1px)'
      }}
      position="relative"
      maxW="100%"
      mx="auto"
      height="100%"
    >
      {/* Image de couverture très réduite */}
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
      </Box>
      
      {/* Contenu ultra-compact */}
      <Box p={2} flex="1" display="flex" flexDirection="column">
        <Stack 
          spacing={2} 
          direction="row" 
          align="flex-start"
          position="relative"
          flex="1"
        >
          {/* Logo très petit */}
          <Box 
            position="relative"
            mt={useBreakpointValue({ 
              base: '-16px', 
              sm: '-18px',
              md: '-24px' 
            })}
            flexShrink={0}
          >
            <Image 
              src={highRes(cover, { width: 80, quality: 80 }) ?? SHOP_PLACEHOLDER} 
              alt="logo" 
              boxSize={logoSize}
              objectFit="cover" 
              borderRadius="md"
              onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
              borderWidth="1.5px"
              borderColor="white"
              boxShadow="0 1px 3px rgba(0,0,0,0.1)"
              bg="white"
            />
          </Box>
          
          {/* Texte très compact */}
          <Box flex="1" minW="0" pt={0.5}>
            <Heading 
              size="xs" 
              noOfLines={1}
              fontWeight="600"
              color="gray.800"
              lineHeight="1.1"
              mb={1}
              fontSize="11px"
            >
              {shop.name || shop.domain}
            </Heading>
            <Text 
              color="gray.600" 
              noOfLines={1}
              fontSize="10px"
              lineHeight="1.2"
            >
              {shop.description || 'Boutique locale'}
            </Text>
          </Box>
        </Stack>
        
        {/* Bouton très compact */}
        <Button 
          as={RouterLink} 
          to={`/shop/${encodeURIComponent(shop.domain || shop.id)}`} 
          colorScheme="brand" 
          size="xs"
          mt={2}
          width="100%"
          borderRadius="sm"
          fontWeight="500"
          height="20px"
          fontSize="10px"
          boxShadow="none"
          _hover={{
            transform: 'translateY(0)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          transition="all 120ms ease"
        >
          Voir
        </Button>
      </Box>
    </Box>
  )
}