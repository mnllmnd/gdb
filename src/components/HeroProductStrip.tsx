import React, { useRef, useState, useEffect } from 'react'
import {
  Box,
  Image,
  Text,
  Heading,
  useColorModeValue,
  Link as ChakraLink,
  IconButton,
  useBreakpointValue,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

type MinimalProduct = {
  id: number | string
  title?: string
  name?: string
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

function ProductImageSlideshow({ images = [], alt }: { images?: string[]; alt?: string }) {
  const [index, setIndex] = useState(0)
  const [isHover, setIsHover] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [images?.length])

  useEffect(() => {
    if (!images || images.length <= 1) return
    if (isHover) return
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 3000)
    return () => clearInterval(t)
  }, [images, isHover])

  const imgs = Array.isArray(images) && images.length ? images : ['/img/b.jfif']

  return (
    <Box
      position="relative"
      width="100%"
      height="100%"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {imgs.map((src, idx) => {
        const visible = idx === index
        return (
          <Image
            key={idx}
            src={src}
            alt={alt}
            objectFit="cover"
            w="100%"
            h="100%"
            position="absolute"
            top={0}
            left={0}
            transition="opacity 0.8s ease-in-out, transform 0.6s ease"
            opacity={visible ? 1 : 0}
            transform={visible ? 'scale(1.06)' : 'scale(1)'}
          />
        )
      })}
    </Box>
  )
}

export default function HeroProductGrid({
  products = [],
  shopsMap = {},
}: {
  products?: MinimalProduct[]
  shopsMap?: Record<string, any>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const bg = useColorModeValue('white', '#0e0e0e')
  const textColor = useColorModeValue('black', 'white')
  const muted = useColorModeValue('gray.500', 'gray.400')

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      return () => el.removeEventListener('scroll', checkScroll)
    }
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 300
      const scrollAmount = cardWidth * 3.5
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <Box
      id="hero-product-grid"
      as="section"
      my={12}
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bouton précédent */}
      {canScrollLeft && (isHovered || isMobile) && (
        <IconButton
          aria-label="Précédent"
          icon={<ChevronLeftIcon boxSize={isMobile ? 5 : 7} />}
          position="absolute"
          left={isMobile ? 1 : 2}
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('black', 'white')}
          boxShadow="xl"
          borderRadius="full"
          size={isMobile ? 'sm' : 'lg'}
          opacity={isMobile ? 0.9 : 0.95}
          _hover={{ 
            opacity: 1, 
            transform: 'translateY(-50%) scale(1.1)',
            bg: useColorModeValue('gray.50', 'gray.700')
          }}
          _active={{
            transform: 'translateY(-50%) scale(0.95)'
          }}
          onClick={() => scroll('left')}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
          backdropFilter="blur(8px)"
        />
      )}

      {/* Bouton suivant */}
      {canScrollRight && (isHovered || isMobile) && (
        <IconButton
          aria-label="Suivant"
          icon={<ChevronRightIcon boxSize={isMobile ? 5 : 7} />}
          position="absolute"
          right={isMobile ? 1 : 2}
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('black', 'white')}
          boxShadow="xl"
          borderRadius="full"
          size={isMobile ? 'sm' : 'lg'}
          opacity={isMobile ? 0.9 : 0.95}
          _hover={{ 
            opacity: 1, 
            transform: 'translateY(-50%) scale(1.1)',
            bg: useColorModeValue('gray.50', 'gray.700')
          }}
          _active={{
            transform: 'translateY(-50%) scale(0.95)'
          }}
          onClick={() => scroll('right')}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
          backdropFilter="blur(8px)"
        />
      )}

      {/* Carrousel horizontal */}
      <Box
        ref={scrollRef}
        display="flex"
        overflowX="auto"
        gap={{ base: 4, md: 6 }}
        px={{ base: 4, md: 8 }}
        py={2}
        css={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollBehavior: 'smooth',
        }}
      >
        {products.map((p) => {
          const finalImages = Array.isArray(p.images) && p.images.length
            ? p.images.map(String).filter(Boolean)
            : p.image_url
            ? [String(p.image_url)]
            : p.product_image
            ? [String(p.product_image)]
            : ['/img/b.jfif']
          const productHref = `/products/${encodeURIComponent(String(p.id))}`

          return (
            <ChakraLink
              as={RouterLink}
              key={String(p.id)}
              to={productHref}
              _hover={{ textDecoration: 'none' }}
              flexShrink={0}
            >
              <Box
                bg={bg}
                overflow="hidden"
                transition="all 0.4s ease"
                _hover={{ transform: 'scale(1.02)' }}
                w={{ base: '160px', md: '250px' }}
              >
                <Box position="relative" aspectRatio="4/5" overflow="hidden" borderRadius="sm">
                  <ProductImageSlideshow
                    images={finalImages}
                    alt={String(p.title || p.name || 'product')}
                  />
                </Box>
                <Box mt={3} textAlign="center">
                  <Heading
                    as="h3"
                    fontSize="sm"
                    fontWeight="500"
                    letterSpacing="wide"
                    color={textColor}
                    textTransform="uppercase"
                    noOfLines={1}
                  >
                    {p.title || p.name}
                  </Heading>
                  <Text mt={1} fontSize="xs" color={muted} letterSpacing="wider">
                    Nouvelle Collection
                  </Text>
                </Box>
              </Box>
            </ChakraLink>
          )
        })}
      </Box>
    </Box>
  )
}