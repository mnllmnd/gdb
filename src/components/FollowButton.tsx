import React, { useEffect, useState } from 'react'
import { Button, Icon, useToast } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import { FiUserCheck } from 'react-icons/fi'

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
    setFollowed(!prev)
    setCount((c) => (c == null ? null : (prev ? c - 1 : c + 1)))
    try {
      if (!prev) await api.shops.follow(id, token)
      else await api.shops.unfollow(id, token)
    } catch (err: any) {
      setFollowed(prev)
      setCount((c) => (c == null ? null : (prev ? c + 1 : c - 1)))
      toast({ title: 'Erreur', description: err?.error || 'Impossible de changer le statut', status: 'error', duration: 3000 })
    }
  }

  return (
    <Button
      onClick={handleToggle}
      size={compact ? 'sm' : 'md'}
      variant={followed ? 'solid' : 'outline'}
      colorScheme={followed ? 'green' : 'blue'}
      leftIcon={<Icon as={FiUserCheck} />}
      borderRadius="xl"
      minW={compact ? 'auto' : '120px'}
    >
      {followed ? 'Suivi' : 'Suivre'}{count != null ? ` • ${count}` : ''}
    </Button>
  )
}

