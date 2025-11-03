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

export default function HeroProductStrip({ products = [] }: { products?: MinimalProduct[] }) {
  const cardHeight = useBreakpointValue({ base: '260px', md: '420px' })
  const bg = useColorModeValue('white', 'gray.800')
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
    <Box id="hero-product-strip" as="section" my={6} px={{ base: 2, md: 6 }}>
      <HStack
        spacing={4}
        overflowX="auto"
        css={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as any}
        py={2}
        role="list"
        aria-label="Produits vedettes"
      >
        {products.map((p) => {
          const img = firstImage(p as MinimalProduct)
          const shopId = (p as any).shop_id || (p as any).seller_id || ''
          const productHref = shopId ? `/shop/${shopId}?product=${p.id}` : `/products/${p.id}`
          const shopHref = shopId ? `/shop/${shopId}` : '#'

          return (
            <Box
              key={String(p.id)}
              as="article"
              role="listitem"
              minW={{ base: '86%', md: '45%', lg: '33%' }}
              flex="0 0 auto"
              borderRadius="xl"
              overflow="hidden"
              bg={bg}
              boxShadow="md"
              transition="transform 0.25s, box-shadow 0.25s"
              _hover={{ transform: !isMobile ? 'translateY(-6px)' : undefined, boxShadow: 'xl' }}
              style={{ scrollSnapAlign: 'start', touchAction: 'pan-x' }}
            >
              <ChakraLink as={RouterLink} to={productHref} style={{ display: 'block' }} aria-label={`Voir ${p.title || p.name}`}>
                <Box position="relative" h={cardHeight} w="100%">
                  <Image
                    src={img}
                    alt={String(p.title || p.name || 'product')}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                    loading={isMobile ? 'eager' : 'lazy'}
                    fallbackSrc="/img/b.jfif"
                    transition="opacity 0.4s"
                    opacity={visible ? 1 : 0}
                    transform={visible ? 'none' : 'translateY(10px)'}
                  />
                  <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(0,0,0,0.04), rgba(0,0,0,0.55))" />
                  <Box position="absolute" left={4} bottom={4} color="white" zIndex={2}>
                    <Badge bg="white" color="black" borderRadius="full" px={{ base: 2, md: 3 }} py={1} fontWeight={700} fontSize={{ base: 'sm', md: 'md' }}>
                      {p.title || p.name}
                    </Badge>
                  </Box>
                </Box>
              </ChakraLink>

              <Box p={3} display="flex" alignItems="center" justifyContent="space-between">
                <ChakraLink as={RouterLink} to={shopHref} aria-label={`Visiter la boutique ${p.shopName || ''}`} fontSize="sm" color="gray.600">
                  <Text fontSize="sm" color="gray.600">{p.shopName || 'Boutique'}</Text>
                </ChakraLink>
              </Box>
            </Box>
          )
        })}
      </HStack>
    </Box>
  )
}
