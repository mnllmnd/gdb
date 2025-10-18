import React from 'react'
import { HStack, IconButton, useBreakpointValue } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

export default function BottomNav(){
  const show = useBreakpointValue({ base: true, md: false })
  if (!show) return null
  return (
    <HStack position="fixed" bottom={4} left={4} right={4} justify="space-around" px={4} zIndex={60} bg="rgba(255,255,255,0.7)" py={3} borderRadius="xl" boxShadow="lg" backdropFilter="blur(6px)">
      <IconButton as={Link} to="/" aria-label="Accueil" icon={<span style={{fontSize:18}}>🏠</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
      <IconButton as={Link} to="/seller" aria-label="Vendeur" icon={<span style={{fontSize:18}}>🏪</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
      <IconButton as={Link} to="/login" aria-label="Compte" icon={<span style={{fontSize:18}}>👤</span>} colorScheme="brand" variant="subtle" size="md" borderRadius="full" />
    </HStack>
  )
}
