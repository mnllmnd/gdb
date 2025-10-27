import React, { useState, useEffect } from 'react'
import {
  Container,
  Heading,
  Button,
  Box,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { getCurrentUser } from '../services/auth'
import api from '../services/api'
import { SimpleGrid, Text } from '@chakra-ui/react'
import ReelUploadForm from '../components/ReelUploadForm'
import { ReelCard, ReelPlayer } from '../components'
import ReelGrid from '../components/ReelGrid'
import { useLocation } from 'react-router-dom'
import ScrollTopButton from '../components/ScrollTopButton'

export default function ReelsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [reloadKey, setReloadKey] = useState(0)
  const location = useLocation()

  useEffect(() => {
    // Auto-open modal when URL has ?upload=1
    const qp = new URLSearchParams(location.search)
    if (qp.get('upload') === '1') {
      const me = getCurrentUser()
      if (!me) {
        // not logged in -> redirect to login preserving next
        const next = window.location.pathname + window.location.search
        window.location.href = `/login?next=${encodeURIComponent(next)}`
        return
      }
      if (me.role !== 'seller') {
        // logged in but not a seller -> send to seller setup
        window.location.href = '/seller/setup'
        return
      }
      onOpen()
    }
  }, [location.search])

  // load reels posted by current user (seller)
  const [myReels, setMyReels] = useState<any[]>([])
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = getCurrentUser()
        if (!me || me.role !== 'seller') return
        const list = await api.products.list()
        const owned = (list || []).filter((p: any) => String(p.seller_id) === String(me.id))
        if (owned.length === 0) {
          if (mounted) setMyReels([])
          return
        }
        const promises = owned.map((p: any) => api.reels.list({ product_id: p.id, limit: 50 }))
        const results = await Promise.all(promises)
        const items = results.flatMap(r => r.items || [])
        if (mounted) setMyReels(items)
      } catch (err) {
        console.error('Failed to load my reels', err)
      }
    })()
    return () => { mounted = false }
  }, [reloadKey])

  const [activeMyReel, setActiveMyReel] = useState<any | null>(null)

  const handleSuccess = () => {
    // increment reloadKey to force ReelGrid to remount and reload
    setReloadKey(k => k + 1)
  }

  const me = getCurrentUser()

  return (
    <Container maxW="container.lg" py={6}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="lg">Reels</Heading>
        {me && me.role === 'seller' ? (
          <Button onClick={onOpen} colorScheme="teal">Publier un reel</Button>
        ) : (
          <Button onClick={() => {
            if (!me) {
              const next = window.location.pathname + window.location.search
              window.location.href = `/login?next=${encodeURIComponent(next)}`
              return
            }
            // logged in but not seller
            window.location.href = '/seller/setup'
          }} colorScheme="gray">Publier un reel</Button>
        )}
      </Box>
      {myReels.length > 0 && (
        <>
          <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md">Mes reels</Heading>
          </Box>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={6}>
            {myReels.map((r: any) => (
              <ReelCard key={r.id} reel={r} onOpen={(reel: any) => setActiveMyReel(reel)} />
            ))}
          </SimpleGrid>
          {activeMyReel && (
            <ReelPlayer reel={activeMyReel} isOpen={Boolean(activeMyReel)} onClose={() => setActiveMyReel(null)} onLiked={() => setReloadKey(k => k + 1)} />
          )}
        </>
      )}
      <Box mt={6}>
        <Heading size="md" mb={4}>Découvrir</Heading>
        <ReelGrid key={reloadKey} />
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Publier un reel</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <ReelUploadForm onSuccess={() => { handleSuccess(); onClose() }} onClose={onClose} />
          </ModalBody>
        </ModalContent>
        </Modal>
        <ScrollTopButton />
    </Container>
  )
}
