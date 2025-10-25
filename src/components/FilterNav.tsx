import React from 'react'
import {
  Box,
  Container,
  Tabs,
  TabList,
  Tab,
  Flex,
  Button,
  Select,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  useColorModeValue,
  HStack,
  Badge,
  Icon,
  VStack,
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
  onCategoryChange
}: FilterNavProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Couleurs adaptatives
  const navBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300')
  const menuBg = useColorModeValue('white', 'gray.800')
  const menuHoverBg = useColorModeValue('brand.50', 'brand.900')
  const selectedBg = useColorModeValue('brand.500', 'brand.600')
  const selectedColor = 'white'

  return (
    <Box 
      py={4} 
      bg={navBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      backdropFilter="blur(12px) saturate(180%)"
      position="sticky" 
      top="0" 
      zIndex="sticky"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
    >
      <Container maxW="container.xl">
        <VStack spacing={4} align="stretch">
          {/* Tabs Produits / Boutiques améliorés */}
          <Tabs
            index={view === 'shops' ? 0 : 1}
            onChange={(i) => onViewChange(i === 0 ? 'shops' : 'products')}
            variant="soft-rounded"
            colorScheme="brand"
            size={isMobile ? "md" : "lg"}
          >
            <TabList gap={2}>
              <Tab
                _selected={{
                  bg: selectedBg,
                  color: selectedColor,
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(200, 124, 74, 0.3)',
                  transform: 'translateY(-1px)',
                }}
                color={textColor}
                fontWeight="600"
                borderRadius="xl"
                px={6}
                py={3}
                transition="all 0.3s ease"
                _hover={{
                  bg: 'brand.50',
                  color: 'brand.600',
                  transform: 'translateY(-1px)',
                }}
                className="tab-shops"
              >
                <HStack spacing={2}>
                  <Icon as={FaStore} boxSize={4} />
                  <Text>Boutiques</Text>
                </HStack>
              </Tab>
              <Tab
                _selected={{
                  bg: selectedBg,
                  color: selectedColor,
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(200, 124, 74, 0.3)',
                  transform: 'translateY(-1px)',
                }}
                color={textColor}
                fontWeight="600"
                borderRadius="xl"
                px={6}
                py={3}
                transition="all 0.3s ease"
                _hover={{
                  bg: 'brand.50',
                  color: 'brand.600',
                  transform: 'translateY(-1px)',
                }}
                className="tab-products"
              >
                <HStack spacing={2}>
                  <Icon as={FaBox} boxSize={4} />
                  <Text>Produits</Text>
                </HStack>
              </Tab>
            </TabList>
          </Tabs>

          {/* Catégories améliorées */}
          {view === 'products' && categories && categories.length > 0 && (
            <Box>
              {isMobile ? (
                // Mobile: Menu amélioré
                <Menu>
                  <MenuButton
                    as={Button}
                    className="category-select"
                    w="full"
                    size="lg"
                    bg={menuBg}
                    color={textColor}
                    borderRadius="xl"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
                    px={4}
                    py={3}
                    rightIcon={<ChevronDownIcon />}
                    _hover={{ 
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-1px)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <HStack spacing={3} justify="space-between" w="full">
                      <HStack spacing={2}>
                        <Icon as={FaFilter} color="brand.500" />
                        <Text fontWeight="600" noOfLines={1}>
                          {selectedCategory == null
                            ? `Toutes les catégories`
                            : categories.find((c) => c.id === selectedCategory)?.name}
                        </Text>
                      </HStack>
                      <Badge 
                        colorScheme="brand" 
                        variant="subtle" 
                        fontSize="xs"
                        px={2}
                        py={1}
                      >
                        {categories.length}
                      </Badge>
                    </HStack>
                  </MenuButton>

                  <MenuList
                    mt={3}
                    borderRadius="xl"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
                    bg={menuBg}
                    minW="auto"
                    w="calc(100% - 32px)"
                    maxH="60vh"
                    overflowY="auto"
                    mx="auto"
                    border="1px solid"
                    borderColor={borderColor}
                    py={2}
                  >
                    <MenuItem
                      onClick={() => onCategoryChange?.(null)}
                      py={3}
                      px={4}
                      bg={selectedCategory === null ? selectedBg : undefined}
                      color={selectedCategory === null ? selectedColor : textColor}
                      _hover={{ 
                        bg: selectedCategory === null ? 'brand.600' : menuHoverBg 
                      }}
                      borderTopRadius="lg"
                      transition="all 0.2s ease"
                    >
                      <HStack justify="space-between" w="full">
                        <HStack spacing={3}>
                          <Icon as={FaTags} />
                          <Text fontWeight="600">Toutes les catégories</Text>
                        </HStack>
                        <Badge 
                          colorScheme="brand" 
                          variant={selectedCategory === null ? "solid" : "subtle"}
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
                        bg={selectedCategory === c.id ? selectedBg : undefined}
                        color={selectedCategory === c.id ? selectedColor : textColor}
                        _hover={{ 
                          bg: selectedCategory === c.id ? 'brand.600' : menuHoverBg 
                        }}
                        transition="all 0.2s ease"
                      >
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="500">{c.name}</Text>
                          {selectedCategory === c.id && (
                            <Badge 
                              colorScheme="white" 
                              variant="solid"
                              fontSize="xs"
                            >
                              ✓
                            </Badge>
                          )}
                        </HStack>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              ) : (
                // Desktop: Menu amélioré
                <Box>
                  <Menu>
                    <MenuButton
                      as={Button}
                      rightIcon={<ChevronDownIcon />}
                      size="lg"
                      bg={menuBg}
                      color={textColor}
                      borderRadius="xl"
                      boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
                      px={6}
                      py={3}
                      _hover={{ 
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-1px)',
                      }}
                      _active={{
                        transform: 'translateY(0)',
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack spacing={3}>
                        <Icon as={FaFilter} color="brand.500" />
                        <Text fontWeight="600">
                          {selectedCategory == null
                            ? `Toutes les catégories`
                            : categories.find((c) => c.id === selectedCategory)?.name}
                        </Text>
                        <Badge 
                          colorScheme="brand" 
                          variant="subtle" 
                          fontSize="sm"
                          px={2}
                          py={1}
                        >
                          {categories.length}
                        </Badge>
                      </HStack>
                    </MenuButton>

                    <MenuList
                      mt={3}
                      borderRadius="xl"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
                      bg={menuBg}
                      minW="280px"
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
                        bg={selectedCategory === null ? selectedBg : undefined}
                        color={selectedCategory === null ? selectedColor : textColor}
                        _hover={{ 
                          bg: selectedCategory === null ? 'brand.600' : menuHoverBg 
                        }}
                        borderTopRadius="lg"
                        transition="all 0.2s ease"
                      >
                        <HStack justify="space-between" w="full">
                          <HStack spacing={3}>
                            <Icon as={FaTags} />
                            <Text fontWeight="600">Toutes les catégories</Text>
                          </HStack>
                          <Badge 
                            colorScheme="brand" 
                            variant={selectedCategory === null ? "solid" : "subtle"}
                            fontSize="sm"
                          >
                            {categories.length}
                          </Badge>
                        </HStack>
                      </MenuItem>
                      
                      <MenuDivider />
                      
                      {categories.map((category) => (
                        <MenuItem
                          key={category.id}
                          onClick={() => onCategoryChange?.(category.id)}
                          py={3}
                          px={4}
                          bg={selectedCategory === category.id ? selectedBg : undefined}
                          color={selectedCategory === category.id ? selectedColor : textColor}
                          _hover={{ 
                            bg: selectedCategory === category.id ? 'brand.600' : menuHoverBg 
                          }}
                          transition="all 0.2s ease"
                        >
                          <HStack justify="space-between" w="full">
                            <Text fontWeight="500">{category.name}</Text>
                            {selectedCategory === category.id && (
                              <Badge 
                                colorScheme="white" 
                                variant="solid"
                                fontSize="xs"
                              >
                                Sélectionné
                              </Badge>
                            )}
                          </HStack>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </Box>
              )}
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  )
}