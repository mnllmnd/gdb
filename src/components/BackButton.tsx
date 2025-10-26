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
      navigate(to)
    } else if (location && (location.state as any)?.from) {
      // If the current location was reached with a 'from' state, prefer returning there
      navigate((location.state as any).from)
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