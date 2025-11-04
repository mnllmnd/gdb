import React from 'react'
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Image,
  useBreakpointValue,
  SimpleGrid,
  HStack,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react'

// helper moved outside component to satisfy lint rules
function waitForTargetGlobal(selector: string, timeout = 1500, interval = 100) {
  return new Promise<boolean>((resolve) => {
    if (typeof document === 'undefined') return resolve(false)
    if (document.querySelector(selector)) return resolve(true)
    const start = Date.now()
    const id = setInterval(() => {
      if (document.querySelector(selector)) {
        clearInterval(id)
        return resolve(true)
      }
      if (Date.now() - start > timeout) {
        clearInterval(id)
        return resolve(false)
      }
    }, interval)
  })
}

const STORAGE_KEY = 'hasSeenTutorial'

export default function TutorielPage() {
  const placement = useBreakpointValue({ base: 'bottom', md: 'right' }) as Step['placement']
  const [run, setRun] = React.useState(false)
  const [joySteps, setJoySteps] = React.useState<Step[]>([])
  const [missingSteps, setMissingSteps] = React.useState<string[] | null>(null)

  const sectionBg = useColorModeValue('white', 'gray.800')
  const debugBg = useColorModeValue('whiteAlpha.900', 'whiteAlpha.100')

  // show debug panel only when explicitly requested via ?debug=1
  const isDebug = typeof globalThis !== 'undefined' && new URLSearchParams(globalThis.location?.search ?? '').get('debug') === '1'

  const steps: Step[] = [
    { target: '.tab-products', content: "Onglet Produits — Parcourez les produits disponibles.", placement },
    { target: '.tab-shops', content: "Onglet Boutiques — Trouvez des boutiques locales.", placement },
    { target: '.search-bar', content: "Barre de recherche — Recherchez des produits ou des boutiques.", placement },
    { target: '.category-select', content: "Filtrer — Affinez votre recherche par catégorie.", placement },
    { target: '.nav-login', content: "Connexion — Connectez-vous pour accéder à votre compte.", placement },
    { target: '.nav-signup', content: "Inscription — Créez un compte pour acheter ou vendre.", placement },
    { target: '.nav-my-shop', content: "Ma boutique — Accédez à votre espace vendeur ou créez une boutique.", placement },
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('Tutoriel: failed to set localStorage', e)
      }
      setRun(false)
    }
  }

  // Wait for target elements before running. Filter unavailable steps.
  React.useEffect(() => {
    let mounted = true
    async function prepare() {
      const resolved: Step[] = []
      for (const s of steps) {
        const selector = String(s.target)
        try {
          const found = await waitForTargetGlobal(selector, 1500)
          if (!mounted) return
          if (found) resolved.push(s)
        } catch (err) {
          // ignore individual step failures but log for debugging
          // eslint-disable-next-line no-console
          console.debug('Tutoriel: step target not found', selector, err)
        }
      }
      setJoySteps(resolved)
      try {
        const stored = localStorage.getItem('tutorialMissingSteps')
        // if explicitly debugging, preserve stored missing steps — otherwise clear them
        if (isDebug) {
          setMissingSteps(stored ? JSON.parse(stored) : [])
        } else {
          try { localStorage.removeItem('tutorialMissingSteps') } catch (e) { console.debug('Tutoriel: failed to remove tutorialMissingSteps', e) }
          setMissingSteps([])
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('Tutoriel: failed to read tutorialMissingSteps', e)
        setMissingSteps([])
      }
    }
    prepare()
    return () => { mounted = false }
  }, [])

  return (
    <Box
      py={{ base: 4, md: 8 }}
      px={{ base: 3, md: 8 }}
      bg="brand.500"
      minH="100vh"
      overflowX="hidden"
    >
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={5} mb={6}>
          <Heading size={{ base: 'md', md: 'lg' }} color="white" textAlign={{ base: 'center', md: 'left' }}>
            Tutoriel d’utilisation
          </Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="white" textAlign="justify">
            Ce guide pas-à-pas vous montre comment utiliser l’application, de l’inscription à la création
            de votre boutique. Vous pouvez cliquer sur "Lancer le tutoriel" pour voir les explications interactives,
            ou simplement suivre les étapes illustrées ci-dessous.
          </Text>

          <Flex
            direction={{ base: 'column', sm: 'row' }}
            gap={3}
            justify={{ base: 'center', md: 'flex-start' }}
            wrap="wrap"
          >
            <Button
              colorScheme="orange"
              size={{ base: 'sm', md: 'md' }}
              onClick={() => {
                setRun(true)
              }}
            >
              Lancer le tutoriel
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              size={{ base: 'sm', md: 'md' }}
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY)
                setRun(false)
              }}
            >
              Réinitialiser (revoir)
            </Button>
          </Flex>
        </VStack>

        <SimpleGrid columns={{ base: 1, sm: 1, md: 2 }} spacing={5} mb={10}>
          {[
            {
              title: '1) Inscription / Connexion',
              text: "Créez un compte pour acheter ou vendre. Si vous êtes déjà inscrit, connectez-vous.",
              img: 'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761131940/pdltbubdxfngvhzpp2ro.png',
              caption: "Page d’inscription (exemple)."
            },
            {
              title: '2) Recherche et navigation',
              text: "Utilisez la barre de recherche pour trouver des produits ou des boutiques rapidement.",
              img: 'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761143438/cqriqgdz6ihhn4yxw7rd.png',
              caption: "La barre de recherche est située en haut de la page."
            },
            {
              title: '3) Onglets Produits / Boutiques',
              text: "Basculez entre les produits et les boutiques pour explorer selon vos besoins.",
              img: 'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761143179/aehpqunllfdxfnaifz5f.png',
              caption: "Utilisez les onglets pour changer de vue."
            },
            {
              title: '4) Créer une boutique (vendeur)',
              text: "Après inscription, allez sur “Ma boutique” pour créer ou configurer votre espace vendeur.",
              img: 'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761133922/k1nq67mxwdsr2i4sj28r.png',
              caption: "Suivez le formulaire pour ajouter vos informations."
            },
            {
              title: '5) Gérer vos produits et commandes',
              text: "Ajoutez des produits, gérez vos stocks et consultez vos commandes depuis votre tableau de bord vendeur.",
              img: 'https://res.cloudinary.com/dcs9vkwe0/image/upload/v1761134104/idyjdyhjowqukgznhpaj.png',
              caption: "Les actions principales sont accessibles depuis le tableau de bord."
            },
          ].map((step) => (
            <Box
              key={step.title}
              bg={sectionBg}
              p={{ base: 3, md: 4 }}
              borderRadius="lg"
              boxShadow="md"
              overflow="hidden"
            >
              <Heading size="sm" mb={2} color="brand.600">
                {step.title}
              </Heading>
              <Text mb={3} fontSize={{ base: 'sm', md: 'md' }}>
                {step.text}
              </Text>
              <Image
                src={step.img}
                alt={step.title}
                objectFit="cover"
                borderRadius="md"
                w="100%"
                maxH={{ base: '200px', md: '240px' }}
                mb={2}
              />
              <Text fontSize="xs" color="gray.500">
                {step.caption}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
          {/* Debug panel: show missing selectors when present (only in debug mode) */}
          {isDebug && missingSteps && missingSteps.length > 0 && (
            <Box bg={debugBg} p={4} borderRadius="md" mt={4}>
              <Heading size="sm" mb={2}>Étapes manquantes détectées</Heading>
              <Text mb={3} fontSize="sm">Les sélecteurs suivants n'ont pas été trouvés dans le DOM au démarrage du tutoriel :</Text>
              <VStack align="start" spacing={1} mb={3}>
                {missingSteps.map((m) => (
                  <Text key={m} fontSize="xs" color="red.600">• {m}</Text>
                ))}
              </VStack>
              <HStack spacing={3}>
                <Button size="sm" colorScheme="orange" onClick={() => {
                  // clear stored missing steps and retry
                  try { localStorage.removeItem('tutorialMissingSteps') } catch(e) { console.debug('Tutoriel: failed to remove tutorialMissingSteps', e) }
                  setMissingSteps(null)
                  setRun(false)
                  setTimeout(() => setRun(true), 150)
                }}>Réessayer</Button>
                <Button size="sm" variant="ghost" onClick={() => { try { localStorage.removeItem('tutorialMissingSteps') } catch(e) { console.debug('Tutoriel: failed to remove tutorialMissingSteps', e) }; setMissingSteps([]) }}>Ignorer</Button>
              </HStack>
            </Box>
          )}
      </Container>

      <Joyride
        steps={joySteps.length ? joySteps : steps}
        run={run}
        continuous
        showSkipButton
        scrollToFirstStep
        callback={handleJoyrideCallback}
        styles={{
          options: {
            zIndex: 9999,
            arrowColor: '#fff',
            primaryColor: '#a86d4d',
            overlayColor: 'rgba(0,0,0,0.5)',
            backgroundColor: '#fff',
            textColor: '#333',
           
          },
          tooltipContainer: {
            textAlign: 'left',
            padding: '16px',
          },
        }}
      />
    </Box>
  )
}
