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
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'

interface FilterNavProps {
  view: 'shops' | 'products'
  onViewChange: (view: 'shops' | 'products') => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function FilterNav({ view, onViewChange, searchQuery, onSearchChange }: FilterNavProps) {
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
        <Tabs index={view === 'shops' ? 0 : 1} onChange={(index) => onViewChange(index === 0 ? 'shops' : 'products')}>
          <TabList>
            <Tab>Boutiques</Tab>
            <Tab>Produits</Tab>
          </TabList>
        </Tabs>
      </Container>
    </Box>
  )
}