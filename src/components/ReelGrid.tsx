import React from 'react'
import { SimpleGrid, Box, Spinner, Center } from '@chakra-ui/react'
import ReelCard from './ReelCard'
import { ReelPlayer } from './index'
import useReels from '../hooks/useReels'

export default function ReelGrid({ productId, limit }: any) {
  // allow parent to pass a smaller limit for condensed sections (e.g. feed)
  const { items, loading, reload } = useReels({ productId, limit })
  const [active, setActive] = React.useState<any | null>(null)
  const lastActiveIdRef = React.useRef<string | null>(null)
  const prevActiveRef = React.useRef<any | null>(null)

  // When opening the player, remember which reel was opened so we can restore scroll/focus on close
  const openPlayer = (reel: any) => {
    lastActiveIdRef.current = String(reel.id)
    setActive(reel)
  }

  // After the player closes, scroll the previously opened reel back into view to avoid jumping to the first video
  React.useEffect(() => {
    // detect transition active: non-null -> null
    if (prevActiveRef.current && !active && lastActiveIdRef.current) {
      const attemptScroll = () => {
        try {
          const el = document.getElementById(`reel-${lastActiveIdRef.current}`)
          if (el) {
            // Use 'nearest' to avoid forcing center alignment which can cause odd jumps for items near
            // the end of the document. If element isn't present yet (due to a reload), we'll retry once.
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
            // clear after successful scroll
            lastActiveIdRef.current = null
            return true
          }
        } catch (e) {
          console.debug('Failed to scroll back to reel', e)
        }
        return false
      }

      // Try immediately; if not found, retry shortly to allow a parent reload to re-render items
      if (!attemptScroll()) {
        setTimeout(() => { attemptScroll() }, 220)
      }
    }
    prevActiveRef.current = active
  }, [active])

  return (
    <Box>
      {loading ? (
        <Center><Spinner /></Center>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {items.map((r: any) => (
            <ReelCard key={r.id} reel={r} onOpen={(reel: any) => openPlayer(reel)} />
          ))}
        </SimpleGrid>
      )}

      {active && (
        <ReelPlayer reel={active} isOpen={Boolean(active)} onClose={() => setActive(null)} onLiked={reload} />
      )}
    </Box>
  )
}
