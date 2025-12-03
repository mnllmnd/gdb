import React from 'react'
import { Text } from '@chakra-ui/react'

type FollowButtonProps = {
  id: string
  compact?: boolean
}

export default function FollowButton({ id, compact }: FollowButtonProps) {
  // Shops removed - follow button no longer available
  return (
    <Text fontSize="sm" color="gray.500">
      Fonction désactivée
    </Text>
  )
}