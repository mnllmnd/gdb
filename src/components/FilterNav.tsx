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
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

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

  return (
    <Box py={4} bg="#a86d4d7f" shadow="sm" position="sticky" top="0" zIndex="sticky" backdropFilter="blur(6px)">
      <Container maxW="container.xl">
        {/* Search has been moved to the header (NavBar). */}

        {/* Tabs Produits / Boutiques */}
        <Tabs
          index={view === 'shops' ? 0 : 1}
          onChange={(i) => onViewChange(i === 0 ? 'shops' : 'products')}
          variant="soft-rounded"
          colorScheme="blackAlpha"
        >
          <TabList>
            <Tab
              _selected={{
                bg: 'black',
                color: 'white',
                fontWeight: 'bold',
              }}
              color="black"
              className="tab-shops"
            >
              Boutiques
            </Tab>
            <Tab
              _selected={{
                bg: 'black',
                color: 'white',
                fontWeight: 'bold',
              }}
              color="black"
              className="tab-products"
            >
              Produits
            </Tab>
          </TabList>
        </Tabs>

        {/* Catégories */}
        {view === 'products' && categories && categories.length > 0 && (
          <Box mt={4} pb={2}>
            {isMobile ? (
              // Mobile: full-width, touch-friendly menu button
              <Menu>
                <MenuButton
                  as={Button}
                  w="full"
                  size="lg"
                  bg="whiteAlpha.900"
                  color="black"
                  borderRadius="full"
                  boxShadow="md"
                  px={4}
                  py={3}
                  rightIcon={<ChevronDownIcon />}
                  _hover={{ boxShadow: 'lg' }}
                >
                  {selectedCategory == null
                    ? `Toutes les catégories (${categories.length})`
                    : categories.find((c) => c.id === selectedCategory)?.name}
                </MenuButton>

                <MenuList
                  mt={2}
                  borderRadius="lg"
                  boxShadow="lg"
                  bg="white"
                  minW="auto"
                  w="calc(100% - 32px)"
                  maxH="60vh"
                  overflowY="auto"
                  mx="auto"
                  px={2}
                >
                  <MenuItem
                    onClick={() => onCategoryChange?.(null)}
                    py={3}
                    bg={selectedCategory === null ? '#a86d4d' : undefined}
                    color={selectedCategory === null ? 'white' : 'black'}
                    _hover={{ bg: selectedCategory === null ? '#8c5639' : 'gray.100' }}
                    borderTopRadius="md"
                  >
                    <Text fontWeight="semibold">Toutes les catégories</Text>
                    <Text ml="auto" color="gray.500" fontSize="sm">{categories.length}</Text>
                  </MenuItem>
                  <MenuDivider />
                  {categories.map((c) => (
                    <MenuItem
                      key={c.id}
                      onClick={() => onCategoryChange?.(c.id)}
                      py={3}
                      bg={selectedCategory === c.id ? '#a86d4d' : undefined}
                      color={selectedCategory === c.id ? 'white' : 'black'}
                      _hover={{ bg: selectedCategory === c.id ? '#8c5639' : 'gray.100' }}
                    >
                      {c.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            ) : (
              // Desktop: beautiful dropdown using Chakra Menu
              <Box>
                {/** compute selected label **/}
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    size="md"
                    bg="whiteAlpha.900"
                    color="black"
                    borderRadius="full"
                    boxShadow="md"
                    px={6}
                    py={3}
                    _hover={{ boxShadow: 'lg' }}
                  >
                    {selectedCategory == null
                      ? `Toutes les catégories (${categories.length})`
                      : categories.find((c) => c.id === selectedCategory)?.name}
                  </MenuButton>

                  <MenuList
                    mt={2}
                    borderRadius="lg"
                    boxShadow="lg"
                    bg="whiteAlpha.900"
                    minW="240px"
                    maxH="300px"
                    overflowY="auto"
                  >
                    <MenuItem
                      onClick={() => onCategoryChange?.(null)}
                      bg={selectedCategory === null ? '#a86d4d' : undefined}
                      color={selectedCategory === null ? 'white' : 'black'}
                      _hover={{ bg: selectedCategory === null ? '#8c5639' : 'gray.100' }}
                      borderTopRadius="lg"
                    >
                      <Text fontWeight="semibold">Toutes les catégories</Text>
                      <Text ml="auto" color="gray.500" fontSize="sm">{categories.length}</Text>
                    </MenuItem>
                    <MenuDivider />
                    {categories.map((category) => (
                      <MenuItem
                        key={category.id}
                        onClick={() => onCategoryChange?.(category.id)}
                        bg={selectedCategory === category.id ? '#a86d4d' : undefined}
                        color={selectedCategory === category.id ? 'white' : 'black'}
                        _hover={{ bg: selectedCategory === category.id ? '#8c5639' : 'gray.100' }}
                      >
                        {category.name}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  )
}
