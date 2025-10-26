import React, { useEffect, useState } from 'react'
import { IconButton, Icon, useToast, Tooltip } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import { FiUserCheck, FiUserPlus } from 'react-icons/fi'

type FollowButtonProps = {
  id: string
  compact?: boolean
}

export default function FollowButton({ id, compact }: FollowButtonProps) {
  const [followed, setFollowed] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!id) return
    const token = getItem('token')
    api.shops.followStatus(id, token ?? undefined)
      .then((res: any) => {
        setFollowed(Boolean(res?.followed))
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
    try {
      if (!prev) await api.shops.follow(id, token)
      else await api.shops.unfollow(id, token)
    } catch (err: any) {
      setFollowed(prev)
      toast({ title: 'Erreur', description: err?.error || 'Impossible de changer le statut', status: 'error', duration: 3000 })
    }
  }

  const tooltipLabel = followed ? 'Ne plus suivre' : 'Suivre cette boutique'
  const icon = followed ? FiUserCheck : FiUserPlus

  return (
    <Tooltip label={tooltipLabel} hasArrow>
      <IconButton
        aria-label={tooltipLabel}
        onClick={handleToggle}
        size={compact ? 'sm' : 'md'}
        variant={followed ? 'solid' : 'outline'}
        colorScheme={followed ? 'green' : 'blue'}
        icon={<Icon as={icon} />}
        borderRadius="xl"
      />
    </Tooltip>
  )
}