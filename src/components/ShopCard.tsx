import React, { useEffect, useState } from 'react'
import { Box, Image, Heading, Text, Stack, Button, useBreakpointValue, useColorModeValue, HStack, Icon, AspectRatio, VStack, Tooltip, Badge } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import { FiHeart, FiUserCheck } from 'react-icons/fi'
import FollowButton from './FollowButton'

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
  const hi = highRes(cover, { width: 1200, quality: 85 }) ?? SHOP_PLACEHOLDER

  // Tailles adaptatives
  // Responsive sizes; if compact, use smaller defaults so multiple cards fit per row
  const cardHeight = height ?? useBreakpointValue({ base: compact ? '80px' : '100px', md: compact ? '100px' : '140px' })
  // Slightly reduce logo size so the cover image is more visible
  const logoSize = useBreakpointValue({ base: compact ? '36px' : '40px', md: compact ? '44px' : '48px' })
  const headingSize = useBreakpointValue({ base: compact ? 'xs' : 'xs', md: compact ? 'xs' : 'sm' })
  const padding = useBreakpointValue({ base: compact ? 2 : 3, md: compact ? 3 : 4 })
  const logoTopOffset = useBreakpointValue({ base: '18px', md: '24px' })

  // Configuration des élévations
  const elevationConfig = {
    sm: { shadow: 'sm', hoverShadow: 'md' },
    md: { shadow: 'md', hoverShadow: 'lg' },
    lg: { shadow: 'lg', hoverShadow: 'xl' },
    xl: { shadow: 'xl', hoverShadow: '2xl' }
  }

  const currentElevation = elevationConfig[elevation]
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const location = useLocation()

  return (
    <Box
      as={RouterLink}
      to={`/shop/${encodeURIComponent(s?.domain || s?.id || '')}`}
      state={{ from: `${location.pathname}${location.search}${location.hash || ''}` }}
      display="flex"
      flexDirection="column"
      width="100%"
      // let the parent grid control column sizing; when compact we should fill the grid cell
      maxW={compact ? '100%' : { base: '100%', sm: '360px', md: '320px' }}
      mx="auto"
      // ensure cards have a minimum height so all cards in the grid are symmetric
      minH={useBreakpointValue({ base: compact ? '220px' : '260px', md: compact ? '240px' : '300px' })}
      borderRadius="2xl"
      overflow="hidden"
      bg={useColorModeValue('white', 'gray.800')}
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow={currentElevation.shadow}
      transition="transform 220ms ease, box-shadow 220ms ease"
      _hover={{ transform: 'translateY(-6px)', boxShadow: currentElevation.hoverShadow }}
    >
      <AspectRatio ratio={compact ? 4 / 3 : 3 / 2} w="100%" flexShrink={0}>
        <Image
          src={hi}
          alt={s?.name || s?.domain || 'cover'}
          objectFit="cover"
          objectPosition="center"
          onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
          loading="lazy"
        />
      </AspectRatio>

      <VStack align="stretch" spacing={compact ? 2 : 3} p={padding} flex={1}>
        <HStack align="start" spacing={3}>
          <Image
            src={highRes(cover, { width: 320, quality: 85 }) ?? SHOP_PLACEHOLDER}
            alt={s?.name || s?.domain || 'logo'}
            boxSize={logoSize}
            objectFit="cover"
            borderRadius="xl"
            onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
            borderWidth="2px"
            borderColor={useColorModeValue('white', 'gray.700')}
            boxShadow="sm"
            flexShrink={0}
          />

          <Box minW={0}>
            <HStack align="center" spacing={3}>
              <Heading size={headingSize} noOfLines={2} fontWeight="700" color={useColorModeValue('gray.800', 'white')}>
                {s?.name || s?.domain}
              </Heading>
              {s?.followers != null && (
                <Badge colorScheme="yellow" variant="subtle" fontSize="sm" px={2} py={1} borderRadius="md">
                  ★ {s.followers}
                </Badge>
              )}
            </HStack>

            <Tooltip label={s?.description || 'Boutique locale de qualité'} hasArrow openDelay={300} placement="top-start">
              <Text
                color={useColorModeValue('gray.600', 'gray.300')}
                noOfLines={compact ? 2 : 4}
                fontSize={compact ? 'sm' : 'md'}
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: compact ? 2 : 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  cursor: 'help'
                }}
              >
                {s?.description || 'Boutique locale de qualité'}
              </Text>
            </Tooltip>
          </Box>
        </HStack>

        <HStack spacing={2} pt={1} mt="auto">
          <FollowButton id={String(s?.id)} compact={compact} />
        </HStack>
      </VStack>
    </Box>
  )
}
