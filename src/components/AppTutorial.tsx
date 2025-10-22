import React from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useBreakpointValue, useColorModeValue } from '@chakra-ui/react'

interface AppTutorialProps {
  enabled?: boolean
}

const STORAGE_KEY = 'hasSeenTutorial'

function waitForTargetGlobal(selector: string, timeout = 1500, interval = 100): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(false)
    if (document.querySelector(selector)) return resolve(true)

    const start = Date.now()
    const id = setInterval(() => {
      if (document.querySelector(selector)) {
        clearInterval(id)
        resolve(true)
      }
      if (Date.now() - start > timeout) {
        clearInterval(id)
        resolve(false)
      }
    }, interval)
  })
}

// Wait for an element to appear using MutationObserver with timeout as fallback
function ensureTargetForIndexGlobal(target: string, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(false)
    if (document.querySelector(target)) return resolve(true)

    const observer = new MutationObserver(() => {
      if (document.querySelector(target)) {
        observer.disconnect()
        resolve(true)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const id = setTimeout(() => {
      observer.disconnect()
      resolve(false)
    }, timeout)
  })
}

export default function AppTutorial({ enabled = true }: AppTutorialProps) {
  const [run, setRun] = React.useState(false)
  const [joySteps, setJoySteps] = React.useState<Step[]>([])
  const [stepIndex, setStepIndex] = React.useState<number>(0)

  const placement = useBreakpointValue({ base: 'bottom', md: 'right' }) as Step['placement']
  const isMobileGlobal = useBreakpointValue({ base: true, md: false })

  const baseSteps: Step[] = [
    {
      target: '.search-bar',
      content: 'Utilisez cette barre pour rechercher des produits ou des boutiques.',
      placement,
      disableBeacon: true,
    },
    {
      target: '.tab-products',
      content: 'Appuyez ici pour explorer tous les produits disponibles.',
      placement,
    },
    {
      target: '.tab-shops',
      content: 'Appuyez ici pour découvrir les boutiques locales.',
      placement,
    },
    {
      target: '.category-select',
      content: 'Filtrez les produits par catégorie ici.',
      placement,
    },
    {
      target: '.nav-my-shop',
      content: 'Accédez à votre espace vendeur ou créez une boutique.',
      placement,
    },
  ]

  const bg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'white')

  React.useEffect(() => {
    // Do not run the automatic tutorial on mobile devices — avoid steps missing in mobile views
    if (!enabled) return
    if (isMobileGlobal) return
    let mounted = true

    async function prepareAndRun() {
      const hasSeen = localStorage.getItem(STORAGE_KEY)
      if (hasSeen) return

      // If on mobile, try to open the sidebar/drawer so mobile-only targets mount
      if (isMobileGlobal) {
        try {
          const hamburger = document.querySelector('.nav-hamburger') as HTMLElement | null
          if (hamburger) hamburger.click()
        } catch (err) {
          // eslint-disable-next-line no-console
          console.debug('AppTutorial: failed to click hamburger', err)
        }
        // small delay to allow drawer animation/mount
        await new Promise(r => setTimeout(r, 300))
      }

      // Use full baseSteps list but control advancement via stepIndex
      setJoySteps(baseSteps)
      setStepIndex(0)

      const missing: string[] = []
      for (let i = 0; i < baseSteps.length; i++) {
        const ok = await ensureTargetForIndex(i)
        if (!mounted) return
        if (!ok) missing.push(String(baseSteps[i].target))
      }

      try {
        localStorage.setItem('tutorialMissingSteps', JSON.stringify(missing))
      } catch (e) {
        console.debug('AppTutorial: failed to write tutorialMissingSteps', e)
      }

      // start with the first available step if any, otherwise show fallback
      const firstAvailable = baseSteps.findIndex((s, i) => !missing.includes(String(s.target)))
      if (firstAvailable >= 0) {
        setStepIndex(firstAvailable)
        setRun(true)
      } else {
        setJoySteps([{
          target: 'body',
          content: "Certaines étapes ne sont pas disponibles dans votre vue actuelle.",
          placement: 'center'
        } as Step])
        setStepIndex(0)
        setRun(true)
      }
    }

    prepareAndRun()
    return () => { mounted = false }
  }, [enabled])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {}
      setRun(false)
    }
    // When user clicks next/back, react-joyride will call callback with lifecycle events.
    // We only advance stepIndex when the next step's target is ready (handled below in onStepChange)
  }

  // helper used in prepareAndRun: ensure target for index i
  async function ensureTargetForIndex(i: number) {
    const step = baseSteps[i]
    if (!step) return false
    const selector = String(step.target)
    // If target likely in drawer, open it on mobile
    if (isMobileGlobal && selector.startsWith('.nav-')) {
      try {
        const hamburger = document.querySelector('.nav-hamburger') as HTMLElement | null
        if (hamburger) hamburger.click()
        await new Promise(r => setTimeout(r, 300))
      } catch {}
    }
    const ok = await ensureTargetForIndexGlobal(selector, 2000)
    return ok
  }

  return (
    <Joyride
      steps={joySteps.length ? joySteps : baseSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={async (data) => {
        handleJoyrideCallback(data)
        // react-joyride lifecycle will send events; when user clicks next, advance stepIndex only if next target ready
        const { action, index, type } = data
        // When user clicks 'next' action, attempt to advance
  const actionStr = String(action)
  if (actionStr === 'next') {
          const nextIndex = (typeof index === 'number') ? index + 1 : null
          if (nextIndex !== null && joySteps[nextIndex]) {
            const selector = String(joySteps[nextIndex].target)
            const ok = await ensureTargetForIndexGlobal(selector, 2000)
            if (ok) {
              setStepIndex(nextIndex)
            } else {
              // if next target missing, show fallback centered step
              setJoySteps([{
                target: 'body', content: 'Étape cible introuvable dans la vue actuelle.', placement: 'center'
              } as Step])
              setStepIndex(0)
            }
          }
        }
        // When user clicks 'back', move back without checks
        if (actionStr === 'back') {
          const prevIndex = (typeof index === 'number') ? index - 1 : null
          if (prevIndex !== null && prevIndex >= 0) setStepIndex(prevIndex)
        }
      }}
      styles={{
        options: {
          zIndex: 9999,
          arrowColor: bg,
          backgroundColor: bg,
          primaryColor: '#a86d4d',
          overlayColor: 'rgba(0,0,0,0.4)',
          textColor,
        },
        tooltipContainer: {
          borderRadius: 8,
          padding: 12,
        },
      }}
      locale={{
        back: 'Retour',
        close: 'Fermer',
        last: 'Terminé',
        next: 'Suivant',
        skip: 'Passer',
      }}
    />
  )
}
