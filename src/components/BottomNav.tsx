import React, { useEffect, useState } from 'react'
import { HStack, IconButton, useBreakpointValue, Box, useToast } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import cart from '../utils/cart'
import { getCurrentUser } from '../services/auth'

export default function BottomNav() {
  const navigate = useNavigate()
  const show = useBreakpointValue({ base: true, md: false })
  const [count, setCount] = useState(0)
  const toast = useToast()

  useEffect(() => {
    function onChange() {
      setCount(cart.list().reduce((s, i) => s + (i.quantity ?? 0), 0))
    }
    onChange()
    if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('cart:changed', onChange)
      return () => globalThis.removeEventListener('cart:changed', onChange)
    }
  }, [])

  if (!show) return null

  return (
    <HStack
      position="fixed"
      bottom={4}
      left={4}
      right={4}
      justify="space-around"
      px={4}
      pr={10}
      py={3}
      zIndex={60}
      bg="#a86d4d7f" // même couleur que le top nav
      borderRadius="xl"
      boxShadow="lg"
      backdropFilter="blur(6px)" // effet de flou doux identique
    >
      <IconButton
        as={Link}
        to="/"
        aria-label="Accueil"
        icon={<span style={{ fontSize: 20 }}>🏠</span>}
        bg="whiteAlpha.900"
        _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
        color="black"
        borderRadius="full"
        boxShadow="md"
      />
      <IconButton
        as={Link}
        to="/seller"
        aria-label="Vendeur"
        icon={<span style={{ fontSize: 20 }}>🏪</span>}
        bg="whiteAlpha.900"
        _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
        color="black"
        borderRadius="full"
        boxShadow="md"
      />
      <Box position="relative">
        <IconButton
          as={Link}
          to="/cart"
          aria-label="Panier"
          icon={<span style={{ fontSize: 20 }}>🛒</span>}
          bg="whiteAlpha.900"
          _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
          color="black"
          borderRadius="full"
          boxShadow="md"
        />
        {count > 0 && (
          <Box
            position="absolute"
            top={-2}
            right={-2}
            bg="red.500"
            color="white"
            px={2}
            py={0}
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
          >
            {count}
          </Box>
        )}
      </Box>
      <IconButton
        aria-label="Compte"
        icon={<span style={{ fontSize: 20 }}>👤</span>}
        bg="whiteAlpha.900"
        _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
        color="black"
        borderRadius="full"
        boxShadow="md"
        onClick={() => {
          const u = getCurrentUser()
          if (u) {
            toast({
              title: `Connecté en tant que ${u.displayName || u.name || u.phone || 'utilisateur'}`,
              status: 'info',
              duration: 2500,
            })
            return
          }
          navigate('/login')
        }}
      />
    </HStack>
  )
}
