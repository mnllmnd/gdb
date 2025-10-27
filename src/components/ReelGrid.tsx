import React from 'react'
import { SimpleGrid, Box, Spinner, Center } from '@chakra-ui/react'
import ReelCard from './ReelCard'
import { ReelPlayer } from './index'
import useReels from '../hooks/useReels'

export default function ReelGrid({ productId, limit }: any) {
  // allow parent to pass a smaller limit for condensed sections (e.g. feed)
  const { items, loading, reload } = useReels({ productId, limit })
  const [active, setActive] = React.useState<any | null>(null)

  return (
    <Box>
      {loading ? (
        <Center><Spinner /></Center>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {items.map((r: any) => (
            <ReelCard key={r.id} reel={r} onOpen={(reel: any) => setActive(reel)} />
          ))}
        </SimpleGrid>
      )}

      {active && (
        <ReelPlayer reel={active} isOpen={Boolean(active)} onClose={() => setActive(null)} onLiked={reload} />
      )}
    </Box>
  )
}
