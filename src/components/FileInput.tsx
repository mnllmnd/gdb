import React, { useRef, useState, useEffect } from 'react'
import { Box, Button, Image, Text, VisuallyHidden } from '@chakra-ui/react'

export default function FileInput({ value, onChange, accept = 'image/*', label = 'Choisir un fichier' }: { value?: File | null, onChange: (f: File | null) => void, accept?: string, label?: string }) {
  const ref = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => { URL.revokeObjectURL(url) }
  }, [value])

  return (
    <Box>
      <VisuallyHidden>
        <input ref={ref} type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </VisuallyHidden>
      <Button onClick={() => ref.current?.click()} size="sm" colorScheme="brand">
        {label}
      </Button>
      {preview ? (
  <Image src={preview} alt="preview" boxSize={{ base: '72px', md: '96px' }} objectFit="cover" mt={3} borderRadius="md" />
      ) : (
        <Text fontSize="sm" color="gray.400" mt={3}>Aucune image sélectionnée</Text>
      )}
    </Box>
  )
}
