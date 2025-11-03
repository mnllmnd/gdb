import React from 'react'
import {
  Box,
  Image,
  Heading,
  Text,
  HStack,
  VStack,
  AspectRatio,
  Badge,
  Tooltip,
  useColorModeValue,
  useBreakpointValue,
  Divider,
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { highRes, SHOP_PLACEHOLDER } from '../utils/image'
import FollowButton from './FollowButton'

type ShopCardProps = {
  shop?: Record<string, any>;
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
  const s: Record<string, any> = shop ?? {
    id: props.id,
    name: props.name,
    domain: props.domain,
    description: props.description,
    logo_url: props.logo_url,
  }

  const cover = s?.logo_url || SHOP_PLACEHOLDER
  const hi = highRes(cover, { width: 1000, quality: 85 }) ?? SHOP_PLACEHOLDER
  const location = useLocation()

  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bg = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.700', 'gray.300')

  const headingSize = useBreakpointValue({ base: 'sm', md: 'sm' })
  const padding = useBreakpointValue({ base: 2, md: 3 })

  // Uniformisation visuelle
  const cardHeight = useBreakpointValue({ base: '269px', md: '360px' }) // hauteur fixe
  const imageRatio = 4 / 3

  const elevationConfig = {
    sm: { shadow: 'sm', hoverShadow: 'md' },
    md: { shadow: 'md', hoverShadow: 'lg' },
    lg: { shadow: 'lg', hoverShadow: 'xl' },
    xl: { shadow: 'xl', hoverShadow: '2xl' },
  }
  const currentElevation = elevationConfig[elevation]

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      boxShadow={currentElevation.shadow}
      transition="all 0.25s ease"
      _hover={{
        transform: 'translateY(-3px)',
        boxShadow: currentElevation.hoverShadow,
      }}
      w={{ base: '100%', sm: '280px', md: '100%' }}
      h={cardHeight}
      mx="auto"
      cursor="default"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* IMAGE */}
      <Box
        as={RouterLink}
        to={`/shop/${encodeURIComponent(s?.domain || s?.id || '')}`}
        state={{ from: `${location.pathname}${location.search}` }}
        flexShrink={0}
        _hover={{ opacity: 0.92 }}
        transition="opacity 0.2s ease"
      >
        <AspectRatio ratio={imageRatio}>
          <Image
            src={hi}
            alt={s?.name || 'cover'}
            objectFit="cover"
            loading="lazy"
            onError={(e: any) => { e.currentTarget.src = SHOP_PLACEHOLDER }}
          />
        </AspectRatio>
      </Box>

      {/* CONTENU */}
      <VStack align="stretch" spacing={2} p={padding} flex={1} justify="space-between">
        <HStack align="center" spacing={3}>
          <Image
            src={highRes(cover, { width: 200, quality: 85 }) ?? SHOP_PLACEHOLDER}
            alt={s?.name}
            boxSize="38px"
            objectFit="cover"
            borderRadius="md"
            borderWidth="1px"
            borderColor={useColorModeValue('gray.100', 'gray.700')}
          />

          <Box minW={0} flex={1}>
            <HStack justify="space-between">
              <Heading
                as={RouterLink}
                to={`/shop/${encodeURIComponent(s?.domain || s?.id || '')}`}
                state={{ from: `${location.pathname}${location.search}` }}
                size={headingSize}
                noOfLines={1}
                fontWeight="600"
                letterSpacing="-0.01em"
                color={useColorModeValue('gray.800', 'white')}
                _hover={{ color: useColorModeValue('black', 'gray.100') }}
                transition="color 0.2s ease"
              >
                {s?.name || s?.domain}
              </Heading>
              {s?.followers != null && (
                <Badge
                  variant="subtle"
                  colorScheme="gray"
                  fontSize="xs"
                  borderRadius="md"
                  px={2}
                >
                  {s.followers}
                </Badge>
              )}
            </HStack>
          </Box>
        </HStack>

        {/* Description limitée en hauteur */}
        <Box flex={1}>
          <Tooltip label={s?.description} hasArrow openDelay={300}>
            <Text
              noOfLines={2}
              fontSize="sm"
              color={textColor}
              opacity={0.85}
              mt={1}
            >
              {s?.description || 'Boutique locale de qualité'}
            </Text>
          </Tooltip>
        </Box>

        <Divider borderColor={useColorModeValue('gray.100', 'gray.700')} />

        {/* BOUTON FOLLOW */}
        <HStack justify="flex-end">
          <FollowButton id={String(s?.id)} compact={true} />
        </HStack>
      </VStack>
    </Box>
  )
}
