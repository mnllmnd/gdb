import React, { useEffect, useState } from 'react'
import { HStack, IconButton, Box, useBreakpointValue } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import cart from '../utils/cart'

export default function BottomNav() {
  const show = useBreakpointValue({ base: true, md: false })
  const [count, setCount] = useState(0)

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
      left={0}
      right={0}
      justify="center"
      spacing={6}
      px={4}
      py={3}
      zIndex={60}
      bg="#a86d4d7f"
      borderRadius="xl"
      boxShadow="lg"
      backdropFilter="blur(6px)"
    >
      {/* Home */}
      <IconButton
        as={Link}
        to="/"
        aria-label="Accueil"
        icon={<span style={{ fontSize: 24 }}>🏠</span>}
        bg="whiteAlpha.900"
        _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
        color="black"
        borderRadius="full"
        boxShadow="md"
        size="lg"
      />

      {/* Feed (mobile) */}
      <IconButton
        as={Link}
        to="/feed"
        aria-label="Fil"
        icon={<span style={{ fontSize: 22 }}>🔥</span>}
        bg="whiteAlpha.900"
        _hover={{ bg: 'whiteAlpha.800', transform: 'scale(1.05)' }}
        color="black"
        borderRadius="full"
        boxShadow="md"
        size="lg"
      />

      
    </HStack>
  )
}
