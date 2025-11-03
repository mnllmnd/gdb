import React from 'react'
import {
  Box,
  HStack,
  Image,
  Text,
  Heading,
  Badge,
  useBreakpointValue,
  Link as ChakraLink,
  useColorModeValue,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

type MinimalProduct = {
  id: number | string
  title?: string
  name?: string
  shop_id?: number | string
  seller_id?: number | string
  shopName?: string
  images?: string[]
  image_url?: string
  product_image?: string
}

function firstImage(p: MinimalProduct) {
  if (Array.isArray(p.images) && p.images.length) return String(p.images[0])
  if (p.image_url) return String(p.image_url)
  if (p.product_image) return String(p.product_image)
  return '/img/b.jfif'
}

function resolveShopName(p: any) {
  return (
    p?.shopName || p?.shop_name || p?.seller_name || p?.store_name || p?.shop?.name || p?.vendor_name || 'Boutique'
  )
}

export default function HeroProductStrip({ products = [], shopsMap = {} }: { products?: MinimalProduct[]; shopsMap?: Record<string, any> }) {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.3)')
  const isMobile = useBreakpointValue({ base: true, md: false })

  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('hero-product-strip')
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight - 100) setVisible(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!products || products.length === 0) return null

  return (
    <Box id="hero-product-strip" as="section" my={10} px={{ base: 4, md: 8 }}>
      <HStack
        spacing={{ base: 4, md: 6 }}
        overflowX="auto"
        css={{ 
          scrollSnapType: 'x mandatory', 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 transparent',
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#A0AEC0',
          },
        } as any}
        py={4}
        pb={6}
        role="list"
        aria-label="Produits vedettes"
      >
        {products.map((p) => {
          const img = firstImage(p as MinimalProduct)
          const shopId = (p as any).shop_id || (p as any).seller_id || ''
          const productHref = shopId ? `/shop/${shopId}?product=${p.id}` : `/products/${p.id}`
          const shopHref = shopId ? `/shop/${shopId}` : '#'

          // try to resolve shop name from product fields first, then from shopsMap (by id or nested maps)
          const shopFromMap = shopId
            ? (shopsMap?.[String(shopId)] || shopsMap?.byId?.[String(shopId)] || shopsMap?.byOwner?.[String(shopId)])
            : null
          const shopNameResolved = resolveShopName(p) || (shopFromMap && (shopFromMap.name || shopFromMap.shopName || shopFromMap.domain)) || 'Boutique'

          return (
            <Box
              key={String(p.id)}
              as="article"
              role="listitem"
              minW={{ base: '82%', sm: '70%', md: '45%', lg: '32%', xl: '28%' }}
              maxW={{ base: '82%', sm: '70%', md: '45%', lg: '32%', xl: '28%' }}
              flex="0 0 auto"
              borderRadius="20px"
              overflow="hidden"
              bg={bg}
              border="1px solid"
              borderColor={borderColor}
              boxShadow={`0 4px 20px ${shadowColor}`}
              transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{ 
                transform: !isMobile ? 'translateY(-10px)' : undefined, 
                boxShadow: `0 12px 40px ${shadowColor}`,
                borderColor: 'blue.300'
              }}
              style={{ scrollSnapAlign: 'center', touchAction: 'pan-x' }}
            >
              <ChakraLink 
                as={RouterLink} 
                to={productHref} 
                style={{ display: 'block' }} 
                      aria-label={`Voir ${p.title || p.name}`}
                _hover={{ textDecoration: 'none' }}
              >
                {/* Image avec overlay gradient subtil */}
                <Box 
                  position="relative" 
                  w="100%"
                  aspectRatio="4/3"
                  overflow="hidden"
                >
                  <Image
                    src={img}
                    alt={String(p.title || p.name || 'product')}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                    loading={isMobile ? 'eager' : 'lazy'}
                    fallbackSrc="/img/b.jfif"
                    transition="all 0.5s ease-out"
                    opacity={visible ? 1 : 0}
                    transform={visible ? 'scale(1)' : 'scale(1.1)'}
                    _hover={{ transform: 'scale(1.08)' }}
                  />
                  {/* Gradient overlay très subtil */}
                  <Box 
                    position="absolute" 
                    inset={0} 
                    bgGradient="linear(to-b, rgba(0,0,0,0), rgba(0,0,0,0.15))"
                    pointerEvents="none"
                  />
                  
                  {/* Badge élégant */}
                  <Box 
                    position="absolute" 
                    top={3} 
                    right={3}
                  >
                    <Badge 
                      bg="rgba(255, 255, 255, 0.95)" 
                      color="gray.800" 
                      borderRadius="full" 
                      px={3} 
                      py={1.5} 
                      fontWeight={700} 
                      fontSize="2xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                      backdropFilter="blur(10px)"
                    >
                      ✨ Vedette
                    </Badge>
                  </Box>
                </Box>

                {/* Contenu avec padding parfait */}
                <Box p={{ base: 4, md: 5 }}>
                  {/* Titre du produit */}
                  <Heading 
                    as="h3" 
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight={700}
                    noOfLines={2}
                    mb={3}
                    lineHeight="1.4"
                    color={useColorModeValue('gray.800', 'white')}
                    minH={{ base: '40px', md: '48px' }}
                  >
                      {p.title || p.name}
                  </Heading>

                  {/* Boutique avec icône */}
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2}
                    pt={2}
                    borderTop="1px solid"
                    borderColor={useColorModeValue('gray.100', 'gray.700')}
                  >
                    <Box
                      as="span"
                      fontSize="xs"
                      color={useColorModeValue('gray.400', 'gray.500')}
                    >
                      
                    </Box>
                      <Text 
                        fontSize="sm" 
                        color={useColorModeValue('gray.600', 'gray.400')}
                        fontWeight={500}
                        noOfLines={1}
                        transition="color 0.2s"
                        _hover={{ color: 'blue.500' }}
                      >
                        {shopNameResolved}
                    </Text>
                  </Box>
                </Box>
              </ChakraLink>
            </Box>
          )
        })}
      </HStack>
    </Box>
  )
}