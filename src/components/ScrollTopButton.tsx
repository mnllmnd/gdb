import React, { useEffect, useState } from 'react'
import { IconButton, useColorModeValue } from '@chakra-ui/react'
import { ArrowUpIcon } from '@chakra-ui/icons'

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false)
  const bg = useColorModeValue('brand.500', 'brand.300')

  useEffect(() => {
    const onScroll = () => {
      try {
        setVisible(window.scrollY > 300)
      } catch (e) {
        // ignore (server-side rendering)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <IconButton
      aria-label="Remonter en haut"
      icon={<ArrowUpIcon />}
      position="fixed"
      right={{ base: 4, md: 8 }}
      bottom={{ base: 80, md: 12 }}
      zIndex={2000}
      borderRadius="full"
      boxShadow="xl"
      display={visible ? 'inline-flex' : 'none'}
      colorScheme="brand"
      size="lg"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '2xl'
      }}
    />
  )
}
