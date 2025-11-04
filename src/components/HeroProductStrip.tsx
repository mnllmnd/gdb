import React, { useRef, useState, useEffect } from 'react'
import {
  Box,
  Image,
  Text,
  Heading,
  useColorModeValue,
  Link as ChakraLink,
  IconButton,
  HStack,
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
      // Scroll d'environ 3-4 produits à la fois
      const cardWidth = 300 // largeur approximative d'une carte
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
      {canScrollLeft && isHovered && (
        <IconButton
          aria-label="Précédent"
          icon={<ChevronLeftIcon boxSize={8} />}
          position="absolute"
          left={2}
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg="white"
          color="black"
          boxShadow="xl"
          borderRadius="full"
          size="lg"
          opacity={0.95}
          _hover={{ opacity: 1, transform: 'translateY(-50%) scale(1.1)' }}
          onClick={() => scroll('left')}
          transition="all 0.2s ease"
        />
      )}

      {/* Bouton suivant */}
      {canScrollRight && isHovered && (
        <IconButton
          aria-label="Suivant"
          icon={<ChevronRightIcon boxSize={8} />}
          position="absolute"
          right={2}
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg="white"
          color="black"
          boxShadow="xl"
          borderRadius="full"
          size="lg"
          opacity={0.95}
          _hover={{ opacity: 1, transform: 'translateY(-50%) scale(1.1)' }}
          onClick={() => scroll('right')}
          transition="all 0.2s ease"
        />
      )}

      {/* Carrousel - TOUS les produits en ligne horizontale */}
      <Box
        ref={scrollRef}
        display="flex"
        overflowX="auto"
        gap={{ base: 4, md: 6 }}
        px={{ base: 4, md: 8 }}
        css={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {products.map((p) => {
          const img = firstImage(p)
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
                <Box
                  position="relative"
                  aspectRatio="4/5"
                  overflow="hidden"
                  borderRadius="sm"
                >
                  <Image
                    src={img}
                    alt={String(p.title || p.name || 'product')}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                    transition="transform 0.6s ease"
                    _hover={{
                      transform: 'scale(1.08)',
                      filter: 'brightness(0.9)',
                    }}
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