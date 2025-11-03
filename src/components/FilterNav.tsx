import React from 'react'
import {
  Box,
  Container,
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  Link,
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
          {/* Nav principale style "Nike" avec mega-dropdown */}
          <Flex w="100%" align="center" justify="center">
            <HStack spacing={{ base: 4, md: 8 }} align="center" mx="auto">
              {isMobile ? (
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="md" px={4} py={3} borderRadius="lg">
                    Menu
                  </MenuButton>
                  <MenuList minW="90vw" p={4}>
                    <SimpleGrid columns={1} spacing={6}>
                      <Box>
                        <Text fontWeight={700} mb={2}>Nouveautés</Text>
                        <VStack align="start" spacing={2}>
                          <Link href="#">Toutes les nouveautés</Link>
                          <Link href="#">Meilleures ventes</Link>
                          <Link href="#">Prochaines sorties</Link>
                        </VStack>
                      </Box>

                      <Box>
                        <Text fontWeight={700} mb={2}>Catégories</Text>
                        <VStack align="start" spacing={2}>
                          {(categories || []).map((c: any) => (
                            <Link key={c.id} onClick={() => onCategoryChange?.(c.id)}>{c.name}</Link>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Text fontWeight={700} mb={2}>Découvrir</Text>
                        <VStack align="start" spacing={2}>
                          <Link href="#">Inspiration</Link>
                          <Link href="#">Tendances</Link>
                          <Link href="#">Collections</Link>
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </MenuList>
                </Menu>
              ) : (
                /* Desktop: full nav with popovers */
                <>
                  {['Nouveau', 'Homme', 'Femme', 'Enfant', 'Sports', 'Sportswear'].map((label) => (
                    <Box key={label}>
                      <Popover trigger={isMobile ? 'click' : 'hover'} placement="bottom-start" isLazy>
                        <PopoverTrigger>
                          <Button
                            variant="ghost"
                            px={{ base: 2, md: 4 }}
                            py={3}
                            fontWeight={700}
                            color={textColor}
                            _hover={{ bg: hoverBg }}
                            _active={{ bg: hoverBg }}
                            aria-haspopup="true"
                            aria-expanded={false}
                          >
                            {label}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          borderRadius="md"
                          boxShadow="lg"
                          bg={menuBg}
                          minW={{ base: '90vw', md: '720px' }}
                          _focus={{ outline: 'none' }}
                        >
                          <PopoverBody p={6}>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                              <Box>
                                <Text fontWeight={700} mb={3}>Nouveautés</Text>
                                <VStack align="start" spacing={2}>
                                  <Link href="#" color="gray.700">Toutes les nouveautés</Link>
                                  <Link href="#" color="gray.700">Meilleures ventes</Link>
                                  <Link href="#" color="gray.700">Prochaines sorties</Link>
                                </VStack>
                              </Box>

                              <Box>
                                <Text fontWeight={700} mb={3}>Catégories</Text>
                                <VStack align="start" spacing={2}>
                                  {(categories || []).slice(0, 6).map((c: any) => (
                                    <Link key={c.id} onClick={() => onCategoryChange?.(c.id)} color="gray.700">{c.name}</Link>
                                  ))}
                                </VStack>
                              </Box>

                              <Box>
                                <Text fontWeight={700} mb={3}>Découvrir</Text>
                                <VStack align="start" spacing={2}>
                                  {(categories || []).slice(6, 14).map((c: any) => (
                                    <Link key={c.id} onClick={() => onCategoryChange?.(c.id)} color="gray.700">{c.name}</Link>
                                  ))}
                                </VStack>
                              </Box>
                            </SimpleGrid>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                    </Box>
                  ))}
                </>
              )}

              {/* Sélecteur catégories à droite (desktop uniquement) */}
              {!isMobile && (
                <Box ml={{ base: 0, md: 8 }}>
                  {view === 'products' && categories.length > 0 && (
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
                        _hover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' }}
                        _active={{ transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                        transition="all 0.25s ease"
                      >
                        <HStack spacing={3}>
                          <Icon as={FaFilter} color="brand.500" />
                          <Text fontWeight="600">
                            {selectedCategory == null
                              ? 'Toutes les catégories'
                              : categories.find((c) => c.id === selectedCategory)?.name}
                          </Text>
                          <Badge colorScheme="brand" variant="subtle" fontSize="sm" px={2} py={1} borderRadius="md">
                            {categories.length}
                          </Badge>
                        </HStack>
                      </MenuButton>

                      <MenuList mt={3} borderRadius="xl" boxShadow="0 8px 32px rgba(0,0,0,0.15)" bg={menuBg} minW={{ base: '90%', md: '300px' }} maxH="400px" overflowY="auto" border="1px solid" borderColor={borderColor} py={2}>
                        <MenuItem onClick={() => onCategoryChange?.(null)} py={3} px={4} bg={selectedCategory === null ? activeBg : undefined} color={selectedCategory === null ? activeColor : textColor} _hover={{ bg: selectedCategory === null ? activeBg : hoverBg }} borderTopRadius="lg">
                          <HStack justify="space-between" w="full">
                            <HStack spacing={3}>
                              <Icon as={FaTags} />
                              <Text fontWeight="600">Toutes les catégories</Text>
                            </HStack>
                            <Badge colorScheme="brand" variant={selectedCategory === null ? 'solid' : 'subtle'} fontSize="xs">{categories.length}</Badge>
                          </HStack>
                        </MenuItem>

                        <MenuDivider />

                        {categories.map((c) => (
                          <MenuItem key={c.id} onClick={() => onCategoryChange?.(c.id)} py={3} px={4} bg={selectedCategory === c.id ? activeBg : undefined} color={selectedCategory === c.id ? activeColor : textColor} _hover={{ bg: selectedCategory === c.id ? activeBg : hoverBg }} transition="all 0.2s ease">
                            <HStack justify="space-between" w="full">
                              <Text fontWeight="500">{c.name}</Text>
                              {selectedCategory === c.id && <Badge colorScheme="white" variant="solid" fontSize="xs">✓</Badge>}
                            </HStack>
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  )}
                </Box>
              )}
            </HStack>
          </Flex>

          
        </VStack>
      </Container>
    </Box>
  )
}
