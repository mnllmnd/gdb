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
  readonly view: 'shops' | 'products'
  readonly onViewChange: (view: 'shops' | 'products') => void
  readonly categories?: any[]
  readonly selectedCategory?: number | null
  readonly onCategoryChange?: (categoryId: number | null) => void
}

export default function FilterNav({
  view,
  onViewChange,
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
          justify="center"
          align="center"
          position="relative"
          flexWrap="wrap"
          gap={4}
        >
          {/* Onglets centrés */}
          <Tabs
            index={view === 'shops' ? 0 : 1}
            onChange={(i) => onViewChange(i === 0 ? 'shops' : 'products')}
            variant="unstyled"
          >
            <TabList gap={isMobile ? 4 : 8}>
              <Tab
                fontWeight="500"
                fontSize={isMobile ? 'sm' : 'md'}
                color={view === 'shops' ? activeColor : inactiveColor}
                borderBottom={
                  view === 'shops'
                    ? '2px solid currentColor'
                    : '2px solid transparent'
                }
                _hover={{ color: activeColor }}
                transition="all 0.2s ease"
                px={isMobile ? 3 : 4}
                py={2}
              >
                <HStack spacing={2}>
                  <Icon
                    as={FaStore}
                    boxSize={isMobile ? 3 : 4}
                    color={view === 'shops' ? activeColor : textSecondary}
                  />
                  <Text color={textPrimary}>Les Boutiques</Text>
                </HStack>
              </Tab>

              <Tab
                fontWeight="500"
                fontSize={isMobile ? 'sm' : 'md'}
                color={view === 'products' ? activeColor : inactiveColor}
                borderBottom={
                  view === 'products'
                    ? '2px solid currentColor'
                    : '2px solid transparent'
                }
                _hover={{ color: activeColor }}
                transition="all 0.2s ease"
                px={isMobile ? 3 : 4}
                py={2}
              >
                <HStack spacing={2}>
                  <Icon
                    as={FaBox}
                    boxSize={isMobile ? 3 : 4}
                    color={view === 'products' ? activeColor : textSecondary}
                  />
                  <Text color={textPrimary}>Les Produits</Text>
                </HStack>
              </Tab>
            </TabList>
          </Tabs>

          {/* Sélecteur de catégories positionné à droite */}
          {view === 'products' && categories.length > 0 && (
            <Box
              position={isMobile ? 'static' : 'absolute'}
              right={isMobile ? 0 : 4}
              top={isMobile ? 'auto' : '50%'}
              transform={isMobile ? 'none' : 'translateY(-50%)'}
            >
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
