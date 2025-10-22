import React from 'react'
import {
  Box,
  Container,
  Tabs,
  TabList,
  Tab,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Flex,
  Button,
  Select,
  useBreakpointValue,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'

interface FilterNavProps {
  view: 'shops' | 'products'
  onViewChange: (view: 'shops' | 'products') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  categories?: any[]
  selectedCategory?: number | null
  onCategoryChange?: (categoryId: number | null) => void
}

export default function FilterNav({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  categories = [],
  selectedCategory,
  onCategoryChange
}: FilterNavProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  return (
    <Box py={4} bg="#a86d4d7f" shadow="sm" position="sticky" top="0" zIndex="sticky" backdropFilter="blur(6px)">
      <Container maxW="container.xl">
        {/* Barre de recherche */}
        <Box mb={4}>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.700" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-bar"
              bg="whiteAlpha.700"
              borderRadius="full"
              color="black"
              _focus={{
                boxShadow: '0 0 0 2px #a86d4d',
                borderColor: '#a86d4d',
              }}
              fontSize="md"
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  aria-label="Effacer la recherche"
                  icon={<CloseIcon w={3} h={3} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => onSearchChange('')}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>

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
              <Select
                className="category-select"
                value={selectedCategory ?? ''}
                onChange={(e) =>
                  onCategoryChange?.(
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                size="lg"
                bg="whiteAlpha.900"
                borderRadius="full"
                boxShadow="md"
                color="black"
                fontWeight="medium"
                _hover={{ boxShadow: 'lg' }}
                _focus={{
                  boxShadow: '0 0 0 2px #a86d4d',
                  borderColor: '#a86d4d',
                }}
              >
                <option value="" style={{ fontWeight: 'bold' }}>
                  Toutes les catégories ({categories.length})
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Box overflowX="auto" whiteSpace="nowrap">
                <Flex gap={2}>
                  <Button
                    variant={selectedCategory === null ? 'solid' : 'outline'}
                    bg={selectedCategory === null ? '#a86d4d' : 'whiteAlpha.800'}
                    color={selectedCategory === null ? 'white' : 'black'}
                    _hover={{
                      bg:
                        selectedCategory === null
                          ? '#8c5639'
                          : 'whiteAlpha.900',
                    }}
                    size="sm"
                    borderRadius="full"
                    onClick={() => onCategoryChange?.(null)}
                  >
                    Toutes les catégories
                  </Button>
                  {categories.map((category) => (
                    <Box
                      key={category.id}
                      as="button"
                      px={4}
                      py={2}
                      borderRadius="full"
                      bg={
                        selectedCategory === category.id
                          ? '#a86d4d'
                          : 'whiteAlpha.800'
                      }
                      color={
                        selectedCategory === category.id ? 'white' : 'black'
                      }
                      fontWeight="medium"
                      _hover={{
                        bg:
                          selectedCategory === category.id
                            ? '#8c5639'
                            : 'whiteAlpha.900',
                      }}
                      onClick={() => onCategoryChange?.(category.id)}
                    >
                      {category.name}
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  )
}
