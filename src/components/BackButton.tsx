import React from 'react'
import { IconButton, Tooltip, Box, useColorModeValue } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'

interface BackButtonProps {
  to?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'solid' | 'outline'
  colorScheme?: 'blue' | 'gray' | 'red' | 'green' | 'purple' | 'teal'
  className?: string
  'data-testid'?: string
}

export default function BackButton({ 
  to, 
  label = "Retour",
  size = "md",
  variant = "solid",
  colorScheme = "teal",
  className,
  'data-testid': testId = 'back-button'
}: Readonly<BackButtonProps>) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    if (to) {
      // `to` may be a string pathname or an object { pathname, focusProductId }
      if (typeof to === 'string') {
        navigate(to)
      } else if (typeof to === 'object' && to !== null) {
        // prefer navigate to the pathname and pass along focus state if present
        const pathname = (to as any).pathname || ''
        const focusProductId = (to as any).focusProductId || (to as any).productId
        if (pathname) {
          const state = focusProductId ? { focusProductId } : undefined
          navigate(pathname, { state })
        } else {
          // fallback to navigate with object (react-router accepts location-like objects)
          navigate(to as any)
        }
      } else {
        navigate(to as any)
      }
    } else if (location && (location.state as any)?.from) {
      // If the current location was reached with a 'from' state, prefer returning there
      const from = (location.state as any).from
      if (typeof from === 'string') navigate(from)
      else if (from && typeof from === 'object') {
        const pathname = from.pathname || ''
        const focusProductId = from.focusProductId || from.productId
        if (pathname) navigate(pathname, { state: focusProductId ? { focusProductId } : undefined })
        else navigate(from)
      } else navigate(-1)
    } else {
      navigate(-1)
    }
  }

  const isDisabled = !to && location.key === 'default'
  const bgHover = useColorModeValue('teal.600', 'teal.400')

  return (
    <Box className={className}>
      <Tooltip 
        label={label} 
        openDelay={300}
        closeDelay={100}
        hasArrow
      >
        <IconButton
          aria-label={label}
          icon={<ArrowBackIcon boxSize={6} />}
          size={size}
          variant={variant}
          colorScheme={colorScheme}
          onClick={handleClick}
          borderRadius="full"
          boxShadow="md"
          isDisabled={isDisabled}
          _hover={{
            transform: 'translateX(-2px)',
            transition: 'transform 0.16s ease-in-out',
            bg: bgHover,
            color: 'white'
          }}
          _active={{
            transform: 'translateX(0px)'
          }}
          data-testid={testId}
          transition="all 0.16s ease-in-out"
          aria-hidden={false}
        />
      </Tooltip>
    </Box>
  )
}