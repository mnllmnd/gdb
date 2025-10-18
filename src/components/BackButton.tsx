import React from 'react'
import { Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ to }: Readonly<{ to?: string }>) {
  const navigate = useNavigate()
  return (
    <Button size="sm" variant="ghost" onClick={() => (to ? navigate(to) : navigate(-1))}>
      ← Retour
    </Button>
  )
}
