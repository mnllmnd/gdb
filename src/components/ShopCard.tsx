import React from 'react'
import { Box, Image, Heading, Text, Stack, Button, useBreakpointValue } from '@chakra-ui/react'
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
  height?: string | number; // optionnel, depuis Home.tsx
};

export default function ShopCard(props: ShopCardProps) {
  const { shop, compact = false, height } = props
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
  const cardHeight = height ?? useBreakpointValue({ base: compact ? 'auto' : '70px', md: '140px' })
  const logoSize = useBreakpointValue({ base: compact ? '28px' : '32px', md: '48px' })
  const headingSize = useBreakpointValue({ base: 'xs', md: 'sm' })
  const padding = useBreakpointValue({ base: 1, md: 2 })
  const logoTopOffset = useBreakpointValue({ base: '12px', md: '24px' })

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
      maxW="320px"
      mx="auto"
      display="flex"
      flexDirection="column"
      zIndex={10}
      height="100%"
    >
  {/* Image de couverture */}
  <Box height={cardHeight} bg="gray.100" overflow="hidden" position="relative">
        <Image 
          src={hi} 
          alt={s?.name || s?.domain || 'cover'} 
          objectFit="cover" 
          objectPosition="center center"
          width="100%" 
          height="100%"
          onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
          loading="lazy"
        />
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height="40%"
          bgGradient="linear(to-t, blackAlpha.200, transparent)"
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
              borderWidth={useBreakpointValue({ base: '2px', md: '3px' })}
              borderColor="white"
              boxShadow="0 4px 12px rgba(0,0,0,0.15)"
              bg="white"
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

        {/* Bouton toujours visible */}
        <Button 
          as={RouterLink} 
          to={`/shop/${encodeURIComponent(s?.domain || s?.id || '')}`} 
          colorScheme="brand" 
          size={compact ? 'sm' : 'md'}
          mt={{ base: 3, md: 5 }}
            mb={{ base: '12px', md: 0 }}
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
