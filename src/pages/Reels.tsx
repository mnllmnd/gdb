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
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { getCurrentUser } from '../services/auth'
import api from '../services/api'
import ReelUploadForm from '../components/ReelUploadForm'
import { ReelCard, ReelPlayer } from '../components'
import ReelGrid from '../components/ReelGrid'
import { useLocation } from 'react-router-dom'
import ScrollTopButton from '../components/ScrollTopButton'

export default function ReelsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [reloadKey, setReloadKey] = useState(0)
  const location = useLocation()
  const [myReels, setMyReels] = useState<any[]>([])
  const [activeMyReel, setActiveMyReel] = useState<any | null>(null)
  const me = getCurrentUser()

  useEffect(() => {
    const qp = new URLSearchParams(location.search)
    if (qp.get('upload') === '1') {
      const me = getCurrentUser()
      if (!me) {
        const next = window.location.pathname + window.location.search
        window.location.href = `/login?next=${encodeURIComponent(next)}`
        return
      }
      if (me.role !== 'seller') {
        window.location.href = '/seller/setup'
        return
      }
      onOpen()
    }
  }, [location.search])

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
    return () => {
      mounted = false
    }
  }, [reloadKey])

  const handleSuccess = () => setReloadKey(k => k + 1)

  return (
    <Box
      bg="#000"
      color="gray.100"
      minH="100vh"
      py={6}
      px={{ base: 4, md: 8 }}
      transition="background-color 0.3s ease"
    >
      <Container maxW="container.lg" px={0}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={6}
          borderBottom="1px solid"
          borderColor="gray.700"
          pb={3}
        >
          <Heading size="lg" color="white" fontWeight="700" letterSpacing="wide">
            Reels
          </Heading>

          {me && me.role === 'seller' ? (
            <Button
              onClick={onOpen}
              bg="white"
              color="black"
              _hover={{ bg: 'gray.300' }}
              fontWeight="600"
              borderRadius="full"
            >
              Publier un reel
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!me) {
                  const next = window.location.pathname + window.location.search
                  window.location.href = `/login?next=${encodeURIComponent(next)}`
                  return
                }
                window.location.href = '/seller/setup'
              }}
              bg="gray.800"
              color="gray.100"
              _hover={{ bg: 'gray.700' }}
              fontWeight="500"
              borderRadius="full"
            >
              Publier un reel
            </Button>
          )}
        </Box>

        {/* Mes Reels */}
        {myReels.length > 0 && (
          <Box mb={10}>
            <Heading size="md" mb={4} color="gray.200">
              Mes reels
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              {myReels.map((r: any) => (
                <ReelCard
                  key={r.id}
                  reel={r}
                  onOpen={(reel: any) => setActiveMyReel(reel)}
                />
              ))}
            </SimpleGrid>
            {activeMyReel && (
              <ReelPlayer
                reel={activeMyReel}
                isOpen={Boolean(activeMyReel)}
                onClose={() => setActiveMyReel(null)}
                onLiked={() => setReloadKey(k => k + 1)}
              />
            )}
          </Box>
        )}

        {/* Découverte */}
        <Box>
          <Heading size="md" mb={4} color="gray.200">
            Découvrir
          </Heading>
          <ReelGrid key={reloadKey} darkMode />
        </Box>

        {/* Modal Upload */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
          <ModalOverlay bg="rgba(0,0,0,0.7)" />
          <ModalContent bg="#111" color="white" border="1px solid #222">
            <ModalHeader borderBottom="1px solid #222">Publier un reel</ModalHeader>
            <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
            <ModalBody pb={6}>
              <ReelUploadForm
                onSuccess={() => {
                  handleSuccess()
                  onClose()
                }}
                onClose={onClose}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        <ScrollTopButton />
      </Container>
    </Box>
  )
}
