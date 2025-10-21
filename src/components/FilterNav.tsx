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
  Text,
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
    <Box py={4} bg="white" shadow="sm" position="sticky" top="0" zIndex="sticky">
      <Container maxW="container.xl">
        <Box mb={4}>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              bg="white"
              borderRadius="full"
              _focus={{
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                borderColor: 'brand.500'
              }}
              fontSize="md"
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  aria-label="Clear search"
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
        <Tabs index={view === 'shops' ? 0 : 1} onChange={(i) => onViewChange(i === 0 ? 'shops' : 'products')} variant="soft-rounded">
          <TabList>
            <Tab>Boutiques</Tab>
            <Tab>Produits</Tab>
          </TabList>
        </Tabs>
        
        {view === 'products' && categories && categories.length > 0 && (
          <Box mt={4} pb={2}>
            {isMobile ? (
              // mobile: styled select with improved UI
              <Select
                value={selectedCategory ?? ''}
                onChange={(e) => onCategoryChange?.(e.target.value === '' ? null : Number(e.target.value))}
                size="lg"
                bg="white"
                borderRadius="full"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
                _focus={{
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  borderColor: 'brand.500'
                }}
                icon={<Box as="span" transform="rotate(0deg)" transition="transform 0.2s">▾</Box>}
                sx={{
                  '& option': {
                    bg: 'white',
                    color: 'gray.800',
                    fontSize: 'md',
                    padding: '8px'
                  }
                }}
              >
                <option value="" style={{ fontWeight: 'bold' }}>
                  Toutes les catégories ({categories.length})
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            ) : (
              // desktop/tablet: pill scroller
              <Box overflowX="auto" whiteSpace="nowrap">
                <Flex gap={2}>
                      <Button
                        variant={selectedCategory === null ? 'solid' : 'ghost'}
                        colorScheme={selectedCategory === null ? 'brand' : 'gray'}
                        size="sm"
                        borderRadius="full"
                        aria-pressed={selectedCategory === null}
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
                      bg={selectedCategory === category.id ? 'brand.500' : 'gray.100'}
                      color={selectedCategory === category.id ? 'white' : 'gray.800'}
                      _hover={{ bg: selectedCategory === category.id ? 'brand.600' : 'gray.200' }}
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