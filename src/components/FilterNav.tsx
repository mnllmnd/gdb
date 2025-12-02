import React from 'react'
import {
  Box,
  Container,
  Tabs,
  TabList,
  Tab,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Icon,
  useColorModeValue,
  useBreakpointValue,
  Button,
  Flex,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaStore, FaBox, FaFilter } from 'react-icons/fa'

interface FilterNavProps {
  readonly categories?: any[]
  readonly selectedCategory?: number | null
  readonly onCategoryChange?: (categoryId: number | null) => void
}

export default function FilterNav({
  categories = [],
  selectedCategory,
  onCategoryChange,
}: FilterNavProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })
 
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Couleurs principales adaptées au mode clair/sombre
  const textPrimary = useColorModeValue('gray.800', 'white')
  const textSecondary = useColorModeValue('gray.600', 'gray.300')
  const activeColor = useColorModeValue('black', 'white')
  const inactiveColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <Box
      borderBottom="1px solid"
      borderColor={borderColor}
      backdropFilter="blur(10px)"
      position="relative"
      top="0"
      zIndex="sticky"
    >
      <Container maxW="container.xl" py={3}>
        <Flex
          justify="space-between"
          align="center"
          position="relative"
          flexWrap="wrap"
          gap={4}
        >
          {/* Titre Les Produits */}
          <HStack spacing={2}>
            <Icon
              as={FaBox}
              boxSize={isMobile ? 3 : 4}
              color={activeColor}
            />
            <Text color={textPrimary} fontWeight="500" fontSize={isMobile ? 'sm' : 'md'}>
              Les Produits
            </Text>
          </HStack>

          {/* Sélecteur de catégories positionné à droite */}
          {categories.length > 0 && (
            <Box>
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  rightIcon={<ChevronDownIcon />}
                  fontWeight="500"
                  fontSize="sm"
                  color={textPrimary}
                  px={3}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <HStack spacing={2}>
                    <Icon as={FaFilter} boxSize={3.5} color={textPrimary} />
                    <Text color={textPrimary}>
                      {selectedCategory == null
                        ? 'Toutes les catégories'
                        : categories.find((c) => c.id === selectedCategory)?.name}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList
                  borderColor={borderColor}
                  minW="200px"
                  py={2}
                >
                  <MenuItem
                    onClick={() => onCategoryChange?.(null)}
                    fontSize="sm"
                    color={selectedCategory === null ? activeColor : textPrimary}
                  >
                    Toutes les catégories
                  </MenuItem>

                  {categories.map((c) => (
                    <MenuItem
                      key={c.id}
                      onClick={() => onCategoryChange?.(c.id)}
                      fontSize="sm"
                      color={selectedCategory === c.id ? activeColor : textPrimary}
                    >
                      {c.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  )
}
