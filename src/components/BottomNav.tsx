import React, { useEffect, useState } from 'react'
import { HStack, IconButton, useBreakpointValue, Box } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import cart from '../utils/cart'

export default function BottomNav(){
  const show = useBreakpointValue({ base: true, md: false })
  const [count, setCount] = useState(0)
  useEffect(() => {
    function onChange() { setCount(cart.list().reduce((s, i) => s + (i.quantity ?? 0), 0)) }
    onChange()
    if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('cart:changed', onChange)
      return () => globalThis.removeEventListener('cart:changed', onChange)
    }
  }, [])
  if (!show) return null
  return (
    <HStack position="fixed" bottom={4} left={4} right={4} justify="space-around" px={4} zIndex={60} bg="rgba(255,255,255,0.7)" py={3} borderRadius="xl" boxShadow="lg" backdropFilter="blur(6px)">
      <IconButton as={Link} to="/" aria-label="Accueil" icon={<span style={{fontSize:18}}>🏠</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
      <IconButton as={Link} to="/seller" aria-label="Vendeur" icon={<span style={{fontSize:18}}>🏪</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
      <IconButton as={Link} to="/cart" aria-label="Panier" icon={<span style={{fontSize:18}}>🛒</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
      {count > 0 && (
        <Box position="absolute" right={16} bottom={8} bg="red.500" color="white" px={2} py={0} borderRadius="full" fontSize="sm">{count}</Box>
      )}
      <IconButton as={Link} to="/login" aria-label="Compte" icon={<span style={{fontSize:18}}>👤</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
    </HStack>
  )
}
