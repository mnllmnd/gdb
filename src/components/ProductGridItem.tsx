import React from 'react'
import { Box, Image, Text, useColorModeValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

interface Props {
  id: string | number
  title?: string
  images?: string[]
  height?: string | number
}

const ProductGridItem: React.FC<Props> = ({ id, title, images, height = '260px' }) => {
  const [hovered, setHovered] = React.useState(false)
  const bg = useColorModeValue('white', 'gray.900')

  const primary = images && images.length ? String(images[0]) : '/img/b.jfif'
  const alt = images && images.length > 1 ? String(images[1]) : primary

  return (
    <Box
      as={RouterLink}
      to={`/products/${id}`}
      display="block"
      bg={bg}
      borderRadius="lg"
      overflow="hidden"
      textDecoration="none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      transition="transform 0.28s ease, box-shadow 0.28s"
      _hover={{ transform: 'translateY(-6px)', boxShadow: 'lg' }}
    >
      <Box position="relative" h={height} w="100%" overflow="hidden">
        <Image
          src={hovered ? alt : primary}
          alt={title || 'product'}
          objectFit="cover"
          w="100%"
          h="100%"
          transition="transform 0.45s ease"
          style={{ transform: hovered ? 'scale(1.04)' : undefined }}
        />
      </Box>

      <Box px={2} py={3}>
        <Text fontSize="sm" fontWeight={600} noOfLines={2} color={useColorModeValue('gray.800','white')}>{title}</Text>
      </Box>
    </Box>
  )
}

export default ProductGridItem
