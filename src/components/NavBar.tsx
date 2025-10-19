import React from 'react'
import { Box, Image, Heading, Text, Stack, Button, useBreakpointValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'

export default function ShopCard({ shop, compact = false }: Readonly<{ shop: Record<string, any>, compact?: boolean }>) {
  const cover = shop.logo_url || SHOP_PLACEHOLDER
  const hi = highRes(cover, { width: 800, quality: 85 }) ?? SHOP_PLACEHOLDER
  
  // Tailles réduites pour mobile - beaucoup plus compact
  const cardHeight = useBreakpointValue({ 
    base: compact ? '80px' : '100px', 
    sm: compact ? '100px' : '120px',
    md: '140px' 
  })
  const logoSize = useBreakpointValue({ 
    base: compact ? '32px' : '36px', 
    sm: compact ? '40px' : '44px',
    md: '48px' 
  })
  const headingSize = useBreakpointValue({ 
    base: compact ? 'xs' : 'sm', 
    sm: 'sm', 
    md: 'md' 
  })

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      bg="white" 
      boxShadow="0 1px 3px rgba(0,0,0,0.08)" 
      transition="all 200ms ease-in-out" 
      _hover={{ 
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)', 
        transform: 'translateY(-1px)'
      }}
      position="relative"
      maxW="100%"
      mx="auto"
      height="100%"
    >
      {/* Image de couverture réduite */}
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
        {/* Overlay gradient plus subtil */}
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height="30%"
          bgGradient="linear(to-t, blackAlpha.100, transparent)"
        />
      </Box>
      
      {/* Contenu compact */}
      <Box p={{ base: compact ? 2 : 3, sm: compact ? 3 : 4 }} flex="1" display="flex" flexDirection="column">
        <Stack 
          spacing={compact ? 2 : 3} 
          direction="row" 
          align="flex-start"
          position="relative"
          flex="1"
        >
          {/* Logo positionné plus haut */}
          <Box 
            position="relative"
            mt={useBreakpointValue({ 
              base: compact ? '-20px' : '-24px', 
              sm: compact ? '-24px' : '-28px',
              md: '-32px' 
            })}
            flexShrink={0}
          >
            <Image 
              src={highRes(cover, { width: 160, quality: 85 }) ?? SHOP_PLACEHOLDER} 
              alt="logo" 
              boxSize={logoSize}
              objectFit="cover" 
              borderRadius="lg"
              onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
              borderWidth="2px"
              borderColor="white"
              boxShadow="0 2px 8px rgba(0,0,0,0.1)"
              bg="white"
            />
          </Box>
          
          {/* Texte compact */}
          <Box flex="1" minW="0" pt={compact ? 0 : 1}>
            <Heading 
              size={headingSize} 
              noOfLines={compact ? 1 : 2}
              fontWeight="600"
              color="gray.800"
              lineHeight="1.2"
              mb={compact ? 1 : 2}
            >
              {shop.name || shop.domain}
            </Heading>
            <Text 
              color="gray.600" 
              noOfLines={compact ? 1 : 2}
              fontSize={useBreakpointValue({ 
                base: compact ? 'xs' : 'sm', 
                sm: 'sm' 
              })}
              lineHeight="1.3"
            >
              {shop.description || 'Boutique locale de qualité'}
            </Text>
          </Box>
        </Stack>
        
        {/* Bouton compact */}
        <Button 
          as={RouterLink} 
          to={`/shop/${encodeURIComponent(shop.domain || shop.id)}`} 
          colorScheme="brand" 
          size={useBreakpointValue({ 
            base: compact ? 'xs' : 'sm', 
            sm: 'sm',
            md: 'md' 
          })}
          mt={compact ? 2 : 3}
          width="100%"
          borderRadius="md"
          fontWeight="500"
          boxShadow="0 1px 2px rgba(0,0,0,0.05)"
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
          transition="all 150ms ease"
        >
          Visiter
        </Button>
      </Box>
    </Box>
  )
}