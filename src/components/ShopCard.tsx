import React from 'react'
import { Box, Image, Heading, Text, Stack, Button, useBreakpointValue, useColorModeValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'

type ShopCardProps = {
  shop?: Record<string, any>;
  // also allow flattened props when component is used as <ShopCard {...shop} />
  id?: string
  name?: string
  domain?: string
  description?: string
  logo_url?: string
  compact?: boolean;
  height?: string | number;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function ShopCard(props: ShopCardProps) {
  const { shop, compact = false, height, elevation = 'md' } = props
  // normalize data whether caller passed `shop={obj}` or spread the shop fields
  const s: Record<string, any> = shop ?? {
    id: props.id,
    name: props.name,
    domain: props.domain,
    description: props.description,
    logo_url: props.logo_url,
  }

  const cover = s?.logo_url || SHOP_PLACEHOLDER
  const hi = highRes(cover, { width: 800, quality: 85 }) ?? SHOP_PLACEHOLDER

  // Tailles adaptatives
  const cardHeight = height ?? useBreakpointValue({ base: compact ? 'auto' : '100px', md: '140px' })
  const logoSize = useBreakpointValue({ base: compact ? '32px' : '48px', md: '56px' })
  const headingSize = useBreakpointValue({ base: 'xs', md: 'sm' })
  const padding = useBreakpointValue({ base: 3, md: 4 })
  const logoTopOffset = useBreakpointValue({ base: '24px', md: '28px' })

  // Configuration des élévations
  const elevationConfig = {
    sm: { shadow: 'sm', hoverShadow: 'md' },
    md: { shadow: 'md', hoverShadow: 'lg' },
    lg: { shadow: 'lg', hoverShadow: 'xl' },
    xl: { shadow: 'xl', hoverShadow: '2xl' }
  }

  const currentElevation = elevationConfig[elevation]
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="2xl" 
      overflow="hidden" 
      bg="white" 
      boxShadow={currentElevation.shadow}
      transition="all 250ms ease-in-out" 
      _hover={{ 
        boxShadow: currentElevation.hoverShadow,
        transform: 'translateY(-4px)'
      }}
      position="relative"
      maxW="320px"
      mx="auto"
      display="flex"
      flexDirection="column"
      zIndex={10}
      height="100%"
      borderColor={borderColor}
    >
      {/* Image de couverture - Améliorée pour mobile */}
      <Box 
        height={cardHeight} 
        bg="gray.100" 
        overflow="hidden" 
        position="relative"
        minHeight={{ base: compact ? '80px' : '100px', md: '140px' }}
      >
        <Image 
          src={hi} 
          alt={s?.name || s?.domain || 'cover'} 
          objectFit="cover" 
          objectPosition="center center"
          width="100%" 
          height="100%"
          onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
          loading="lazy"
          transition="transform 0.3s ease"
          _hover={{ transform: 'scale(1.05)' }}
          // Assure que l'image s'affiche entièrement
          sx={{ 
            '&': {
              display: 'block'
            }
          }}
        />
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height="40%"
          bgGradient="linear(to-t, blackAlpha.300, transparent)"
        />
      </Box>

      {/* Contenu */}
      <Box p={padding} flex="1" display="flex" flexDirection="column">
        <Stack spacing={3} direction="row" align="flex-start" flex="1">
          <Box 
            position="relative"
            mt={`-${logoTopOffset}`}
            flexShrink={0}
          >
            <Image 
              src={highRes(cover, { width: 160, quality: 85 }) ?? SHOP_PLACEHOLDER} 
              alt={s?.name || s?.domain || 'logo'} 
              boxSize={logoSize}
              objectFit="cover" 
              borderRadius="xl"
              onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
              borderWidth={useBreakpointValue({ base: '3px', md: '4px' })}
              borderColor="white"
              boxShadow="0 4px 12px rgba(0,0,0,0.15)"
              bg="white"
              minW={logoSize}
              // Garantit un affichage correct sur mobile
              sx={{ 
                '&': {
                  display: 'block'
                }
              }}
            />
          </Box>

          <Box flex="1" minW="0" pt={1}>
            <Heading size={headingSize} noOfLines={2} fontWeight="600" color="gray.800" lineHeight="1.3" mb={2}>
              {s?.name || s?.domain}
            </Heading>
            <Text color="gray.600" noOfLines={compact ? 2 : 3} fontSize={compact ? 'sm' : 'md'} lineHeight="1.4">
              {s?.description || 'Boutique locale de qualité'}
            </Text>
          </Box>
        </Stack>

        {/* Bouton corrigé - couleur visible */}
        <Button 
          as={RouterLink} 
          to={`/shop/${encodeURIComponent(s?.domain || s?.id || '')}`} 
          size={compact ? 'sm' : 'md'}
          mt={{ base: 4, md: 5 }}
          mb={{ base: 1, md: 0 }}
          width="100%"
          borderRadius="xl"
          fontWeight="600"
          bgGradient="linear(to-r, brand.500, brand.600)"
          color="white" // Texte blanc bien visible
          boxShadow="0 4px 12px rgba(49, 130, 206, 0.25)"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(49, 130, 206, 0.35)',
            bgGradient: 'linear(to-r, brand.600, brand.700)'
          }}
          _active={{
            transform: 'translateY(0)',
            boxShadow: '0 2px 8px rgba(49, 130, 206, 0.3)'
          }}
          transition="all 200ms ease"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transition: 'left 0.5s ease'
          }}
          sx={{
            '&:hover::before': {
              left: '100%'
            }
          }}
        >
          Visiter la boutique
        </Button>
      </Box>
    </Box>
  )
}