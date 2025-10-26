import React, { useEffect, useState } from 'react'
import { IconButton, Icon, useToast, Tooltip, Badge, HStack, Text } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import { FiUserCheck, FiUserPlus } from 'react-icons/fi'

type FollowButtonProps = {
  id: string
  compact?: boolean
}

export default function FollowButton({ id, compact }: FollowButtonProps) {
  const [followed, setFollowed] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (!id) return
    const token = getItem('token')
    api.shops.followStatus(id, token ?? undefined)
      .then((res: any) => {
        setFollowed(Boolean(res?.followed))
        setCount(typeof res?.count === 'number' ? res.count : null)
      })
      .catch(() => {})
  }, [id])

  const handleToggle = async () => {
    const token = getItem('token')
    if (!token) {
      toast({ title: 'Connectez-vous', description: 'Vous devez être connecté pour suivre', status: 'warning', duration: 3000 })
      return
    }
    const prev = followed
    const prevCount = count
    setFollowed(!prev)
    setCount(c => (c == null ? null : (prev ? c - 1 : c + 1)))
    try {
      if (!prev) await api.shops.follow(id, token)
      else await api.shops.unfollow(id, token)
    } catch (err: any) {
      setFollowed(prev)
      setCount(prevCount)
      toast({ title: 'Erreur', description: err?.error || 'Impossible de changer le statut', status: 'error', duration: 3000 })
    }
  }

  const tooltipLabel = followed ? 
    `Ne plus suivre • ${count} abonnés` : 
    `Suivre cette boutique • ${count} abonnés`

  return (
    <Tooltip label={tooltipLabel} hasArrow>
      <HStack 
        spacing={1} 
        bg={followed ? 'green.50' : 'blue.50'} 
        borderWidth="1px"
        borderColor={followed ? 'green.200' : 'blue.200'}
        borderRadius="xl"
        px={2}
        py={1}
        cursor="pointer"
        onClick={handleToggle}
        _hover={{
          bg: followed ? 'green.100' : 'blue.100',
          transform: 'scale(1.05)'
        }}
        transition="all 0.2s ease"
      >
        <Icon 
          as={followed ? FiUserCheck : FiUserPlus} 
          color={followed ? 'green.600' : 'blue.600'}
          boxSize={4}
        />
        {count != null && count > 0 && (
          <Text 
            fontSize="sm" 
            fontWeight="bold" 
            color={followed ? 'green.700' : 'blue.700'}
            minW="20px"
            textAlign="center"
          >
            {count}
          </Text>
        )}
      </HStack>
    </Tooltip>
  )
}