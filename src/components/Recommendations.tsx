import React, { forwardRef, useImperativeHandle } from 'react'
import {
  Box,
  Select,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Spinner,
  useToast,
  useColorModeValue,
  ScaleFade,
  Badge,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useBreakpointValue,
  Stack,
  Divider,
} from '@chakra-ui/react'
import api from '../services/api'
import ProductCard from './ProductCard'

function onlyDigits(s: string) {
  return s?.replace(/\D/g, '') || ''
}

type Props = {
  hideTrigger?: boolean
}

const Recommendations = forwardRef(({ hideTrigger = false }: Props, ref) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  useImperativeHandle(ref, () => ({ open: onOpen }))
  const [occasion, setOccasion] = React.useState('cadeau femme')
  const [budget, setBudget] = React.useState<string>('20000')
  const [queryText, setQueryText] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<any[]>([])
  const toast = useToast()

  // Palette douce et élégante
  const accentColor = '#8B5E3C'
  const lightAccent = '#EAD7C1'
  const bgGradient = 'linear-gradient(145deg, #F9F6F3 0%, #F1E8E0 100%)'
  const textColor = '#4B3A2F'
  const borderColor = '#D7C4B1'
  const inputBg = useColorModeValue('white', '#1A202C')
  const modalSize = useBreakpointValue({ base: 'sm', md: '2xl', lg: '3xl' })
  const gridCols = useBreakpointValue({ base: 1, sm: 2, md: 3 })

  async function findRecommendations() {
    setLoading(true)
    setResults([])
    try {
      const payload: any = { text: `${occasion} ${queryText}`.trim() }
      if (budget && !Number.isNaN(Number(budget))) payload.budget = Number(budget)
      const res = await api.recommend.find(payload)
      setResults(res?.results || [])
      if (!res?.results?.length) {
        toast({
          title: 'Aucune recommandation trouvée',
          description: 'Essayez avec un budget plus large ou un autre type de cadeau.',
          status: 'info',
          duration: 4000,
        })
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: "Impossible d'obtenir des recommandations",
        status: 'error',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton principal (optionnel) */}
      {!hideTrigger && (
        <Box textAlign="center" mt={4}>
          <Button
            onClick={onOpen}
            bgGradient="linear(to-r, #b16d56ff, #9f6044ff)"
            color="white"
            borderRadius="2xl"
            px={8}
            py={6}
            fontSize="md"
            fontWeight="semibold"
            _hover={{
              transform: 'translateY(-2px)',
              bgGradient: 'linear(to-r, #a55347ff, #8d4d3bff)',
            }}
            transition="all 0.2s ease-in-out"
          >
            Tu cherches?
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size={modalSize} isCentered>
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
        <ModalContent
          borderRadius="2xl"
          bg={bgGradient}
          boxShadow="0 10px 40px rgba(139, 69, 19, 0.1)"
          border={`1px solid ${borderColor}`}
          overflow="hidden"
        >
          <ModalHeader
            bg={accentColor}
            color="white"
            textAlign="center"
            py={5}
            fontSize="lg"
            fontWeight="bold"
          >
            Recommandations 
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: 'rgba(255,255,255,0.2)' }} />
          <ModalBody p={6}>
            <ScaleFade in={true}>
              <VStack spacing={6} align="stretch">
                <Box textAlign="center">
                  <Text fontSize="sm" color={textColor} opacity={0.8}>
                    Trouvez le cadeau idéal selon l’occasion et votre budget
                  </Text>
                  <Badge
                    mt={3}
                    px={3}
                    py={1}
                    bg={lightAccent}
                    color={textColor}
                    borderRadius="full"
                    fontWeight="medium"
                    boxShadow="inset 0 0 4px rgba(0,0,0,0.1)"
                  >
                    💡 Essayez : Anniversaire, Mariage, Fête
                  </Badge>
                </Box>

                <Divider borderColor={borderColor} />

                {/* Formulaire */}
                <Stack spacing={5}>
                  <FormControl>
                    <FormLabel fontSize="sm" color={textColor} fontWeight="medium">
                      Occasion
                    </FormLabel>
                    <Select
  value={occasion}
  onChange={(e) => setOccasion(e.target.value)}
  bg={inputBg}
  borderRadius="lg"
  size="md"
  borderColor={borderColor}
  color={textColor}
  fontWeight="medium"
  transition="all 0.25s ease"
  boxShadow="sm"
  _hover={{
    borderColor: accentColor,
    boxShadow: `0 0 6px ${accentColor}40`,
  }}
  _focus={{
    borderColor: accentColor,
    boxShadow: `0 0 0 3px ${accentColor}40`,
  }}
  iconColor={accentColor}
  sx={{
    option: {
      bg: 'white',          // fond normal
      color: textColor,     // texte normal
      _hover: { bg: lightAccent },   // fond au survol
      _selected: {           // suppression du bleu par défaut
        bg: lightAccent,     // fond marron clair
        color: textColor,    // texte sombre
      },
    },
  }}
>
  <option value="cadeau femme">🎀 Cadeau pour femme</option>
  <option value="cadeau homme">🎁 Cadeau pour homme</option>
  <option value="fêtes">🎉 fêtes</option>
  <option value="mariage">💍 Mariage</option>
  <option value="plaisir"> ❤ juste Pour faire plaisir</option>
  <option value="decoration">🏡 Décoration maison</option>
</Select>

                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={textColor} fontWeight="medium">
                      Budget (FCFA)
                    </FormLabel>
                    <Input
                      value={budget}
                      onChange={(e) => setBudget(onlyDigits(e.target.value))}
                      bg={inputBg}
                      borderRadius="lg"
                      size="md"
                      borderColor={borderColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: `0 0 0 2px ${accentColor}40`,
                      }}
                      inputMode="numeric"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={textColor} fontWeight="medium">
                      Détails (optionnel)
                    </FormLabel>
                    <Input
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Ex : parfum, bijou, romantique..."
                      bg={inputBg}
                      borderRadius="lg"
                      size="md"
                      borderColor={borderColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: `0 0 0 2px ${accentColor}40`,
                      }}
                    />
                  </FormControl>

                  <Button
                    onClick={findRecommendations}
                    bgGradient="linear(to-r, #A67B5B, #8B5E3C)"
                    color="white"
                    borderRadius="xl"
                    h="45px"
                    fontWeight="semibold"
                    _hover={{
                      transform: 'translateY(-2px)',
                      bgGradient: 'linear(to-r, #8B5E3C, #6E4B2F)',
                      boxShadow: '0 6px 16px rgba(139, 69, 19, 0.25)',
                    }}
                    transition="all 0.2s ease-in-out"
                  >
                    {loading ? (
                      <HStack>
                        <Spinner size="sm" color="white" />
                        <Text>Analyse en cours...</Text>
                      </HStack>
                    ) : (
                      'Générer mes recommandations'
                    )}
                  </Button>
                </Stack>

                {/* Résultats */}
                <Box mt={2}>
                  {loading ? (
                    <VStack py={5}>
                      <Spinner size="md" color={accentColor} />
                      <Text color={textColor} fontSize="sm">
                        Recherche de produits en cours...
                      </Text>
                    </VStack>
                  ) : results.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="semibold" color={textColor}>
                        {results.length} idée(s) trouvée(s)
                      </Text>
                      <SimpleGrid columns={gridCols} spacing={3}>
                        {results.map((r) => (
                          <Box
                            key={r.id}
                            bg="white"
                            borderRadius="xl"
                            p={2}
                            border={`1px solid ${borderColor}`}
                            transition="all 0.2s"
                            _hover={{
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 16px rgba(139, 69, 19, 0.15)',
                            }}
                          >
                            <ProductCard
                              id={String(r.id)}
                              title={r.name}
                              price={r.price}
                              image_url={r.image || r.image_url}
                            />
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color={textColor} textAlign="center" opacity={0.7}>
                      Aucune suggestion disponible pour ces critères.
                    </Text>
                  )}
                </Box>
              </VStack>
            </ScaleFade>
          </ModalBody>

          <ModalFooter bg="white" borderTop={`1px solid ${borderColor}`} py={3}>
            <Button
              onClick={onClose}
              variant="outline"
              borderColor={borderColor}
              color={textColor}
              _hover={{ bg: lightAccent }}
              borderRadius="xl"
              width="full"
            >
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
})

export default Recommendations
