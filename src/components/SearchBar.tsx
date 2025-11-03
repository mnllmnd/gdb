import React, { useState } from 'react'
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg' // Taille optionnelle
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
  size = 'md', // Valeur par défaut
}: SearchBarProps) {
  const { isOpen, onToggle } = useDisclosure()
  const [isFocused, setIsFocused] = useState(false)

  return (
    <Box position="relative">
      {isOpen ? (
        <Collapse in={isOpen} animateOpacity>
          <Box
            position="absolute"
            right="0"
            top="-8px"
            width={{ base: '200px', sm: '250px', md: '300px' }}
            transform="translateY(-50%)"
            zIndex={2}
          >
            <InputGroup size={size}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color={isFocused ? 'brand.500' : 'gray.400'} />
              </InputLeftElement>
              <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                bg="white"
                borderRadius="full"
                boxShadow="lg"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false)
                  if (!value) onToggle()
                }}
                autoFocus
              />
              <InputRightElement>
                <IconButton
                  aria-label="Effacer"
                  icon={<CloseIcon w={3} h={3} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => {
                    onChange('')
                    if (!isFocused) onToggle()
                  }}
                />
              </InputRightElement>
            </InputGroup>
          </Box>
        </Collapse>
      ) : (
        <IconButton
          aria-label="Rechercher"
          icon={<SearchIcon />}
          variant="ghost"
          color="white"
          _hover={{ bg: 'whiteAlpha.200' }}
          onClick={onToggle}
        />
      )}
    </Box>
  )
}
