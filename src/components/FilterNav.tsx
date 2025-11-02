import React from 'react'
import {
  Box,
  Container,
  Tabs,
  TabList,
  Tab,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  useBreakpointValue,
  useColorModeValue,
  HStack,
  Badge,
  Icon,
  VStack,
  Flex,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaStore, FaBox, FaTags, FaFilter } from 'react-icons/fa'

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

  // 🎨 Palette & styles pro
  const navBg = useColorModeValue('rgba(255,255,255,0.85)', 'rgba(26,32,44,0.8)')
  const borderColor = useColorModeValue('rgba(0,0,0,0.08)', 'rgba(255,255,255,0.1)')
  const textColor = useColorModeValue('gray.800', 'white')
  const menuBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('brand.50', 'gray.700')
  const activeBg = useColorModeValue('brand.500', 'brand.600')
  const activeColor = 'white'

  return (
    <Box
      py={{ base: 3, md: 4 }}
      bg={navBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      backdropFilter="blur(16px) saturate(180%)"
      position="sticky"
      top="0"
      zIndex="sticky"
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <VStack spacing={4} align="center" justify="center">
          {/* Onglets centrés */}
          <Tabs
            index={view === 'shops' ? 0 : 1}
            onChange={(i) => onViewChange(i === 0 ? 'shops' : 'products')}
            variant="soft-rounded"
            colorScheme="brand"
            size={isMobile ? 'md' : 'lg'}
            align="center"
          >
            <Flex justify="center">
              <TabList gap={{ base: 2, md: 6 }} justifyContent="center">
                <Tab
                  _selected={{
                    bg: activeBg,
                    color: activeColor,
                    fontWeight: '700',
                    boxShadow: '0 4px 14px rgba(200, 124, 74, 0.3)',
                    transform: 'translateY(-1px)',
                  }}
                  color={textColor}
                  borderRadius="xl"
                  px={{ base: 4, md: 8 }}
                  py={3}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: hoverBg,
                    transform: 'translateY(-1px)',
                  }}
                >
                  <HStack spacing={2}>
                    <Icon as={FaStore} boxSize={4} />
                    <Text>Boutiques</Text>
                  </HStack>
                </Tab>

                <Tab
                  _selected={{
                    bg: activeBg,
                    color: activeColor,
                    fontWeight: '700',
                    boxShadow: '0 4px 14px rgba(200, 124, 74, 0.3)',
                    transform: 'translateY(-1px)',
                  }}
                  color={textColor}
                  borderRadius="xl"
                  px={{ base: 4, md: 8 }}
                  py={3}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: hoverBg,
                    transform: 'translateY(-1px)',
                  }}
                >
                  <HStack spacing={2}>
                    <Icon as={FaBox} boxSize={4} />
                    <Text>Produits</Text>
                  </HStack>
                </Tab>
              </TabList>
            </Flex>
          </Tabs>

          {/* Sélecteur de catégories */}
          {view === 'products' && categories.length > 0 && (
            <Flex justify="center" w="full">
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  size={isMobile ? 'md' : 'lg'}
                  bg={menuBg}
                  color={textColor}
                  borderRadius="xl"
                  px={{ base: 4, md: 6 }}
                  py={3}
                  boxShadow="0 2px 10px rgba(0,0,0,0.08)"
                  _hover={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  transition="all 0.25s ease"
                >
                  <HStack spacing={3}>
                    <Icon as={FaFilter} color="brand.500" />
                    <Text fontWeight="600">
                      {selectedCategory == null
                        ? 'Toutes les catégories'
                        : categories.find((c) => c.id === selectedCategory)?.name}
                    </Text>
                    <Badge
                      colorScheme="brand"
                      variant="subtle"
                      fontSize="sm"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {categories.length}
                    </Badge>
                  </HStack>
                </MenuButton>

                <MenuList
                  mt={3}
                  borderRadius="xl"
                  boxShadow="0 8px 32px rgba(0,0,0,0.15)"
                  bg={menuBg}
                  minW={{ base: '90%', md: '300px' }}
                  maxH="400px"
                  overflowY="auto"
                  border="1px solid"
                  borderColor={borderColor}
                  py={2}
                >
                  <MenuItem
                    onClick={() => onCategoryChange?.(null)}
                    py={3}
                    px={4}
                    bg={selectedCategory === null ? activeBg : undefined}
                    color={selectedCategory === null ? activeColor : textColor}
                    _hover={{ bg: selectedCategory === null ? activeBg : hoverBg }}
                    borderTopRadius="lg"
                  >
                    <HStack justify="space-between" w="full">
                      <HStack spacing={3}>
                        <Icon as={FaTags} />
                        <Text fontWeight="600">Toutes les catégories</Text>
                      </HStack>
                      <Badge
                        colorScheme="brand"
                        variant={selectedCategory === null ? 'solid' : 'subtle'}
                        fontSize="xs"
                      >
                        {categories.length}
                      </Badge>
                    </HStack>
                  </MenuItem>

                  <MenuDivider />

                  {categories.map((c) => (
                    <MenuItem
                      key={c.id}
                      onClick={() => onCategoryChange?.(c.id)}
                      py={3}
                      px={4}
                      bg={selectedCategory === c.id ? activeBg : undefined}
                      color={selectedCategory === c.id ? activeColor : textColor}
                      _hover={{
                        bg: selectedCategory === c.id ? activeBg : hoverBg,
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="500">{c.name}</Text>
                        {selectedCategory === c.id && (
                          <Badge colorScheme="white" variant="solid" fontSize="xs">
                            ✓
                          </Badge>
                        )}
                      </HStack>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Flex>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
