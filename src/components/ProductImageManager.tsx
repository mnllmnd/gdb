import React from 'react'
import { Box, Image, SimpleGrid, Icon, Button, HStack, VStack, useToast, Text } from '@chakra-ui/react'
import { FiX, FiChevronLeft, FiChevronRight, FiUpload } from 'react-icons/fi'
import api from '../services/api'
import { highRes } from '../utils/image'

type Props = {
  productId?: string
  initialImages?: string[]
  onChange?: (images: string[]) => void
  saveOnChange?: boolean
}

export default function ProductImageManager({ productId, initialImages = [], onChange, saveOnChange = false }: Props) {
  const [images, setImages] = React.useState<Array<{ url: string; file?: File }>>(initialImages.map(u => ({ url: u })))
  const [uploading, setUploading] = React.useState(false)
  const toast = useToast()

  React.useEffect(() => { setImages(initialImages.map(u => ({ url: u }))) }, [initialImages])

  const notifyChange = async (next: Array<{ url: string; file?: File }>) => {
    setImages(next)
    const urls = next.map(i => i.url)
    if (typeof onChange === 'function') onChange(urls)
    if (saveOnChange && productId) {
      try {
        const token = (globalThis as any)?.localStorage?.getItem?.('token')
        await api.products.update(productId, { images: urls }, token ?? undefined)
        toast({ status: 'success', description: 'Images enregistrées', title: 'Sauvegarde' })
      } catch (err) {
        console.error('Failed saving images', err)
        toast({ status: 'error', description: 'Impossible d\'enregistrer les images', title: 'Erreur' })
      }
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    // ✅ FIX: Typage correct pour Array.from
    const arr = Array.from(files).filter((f): f is File => {
      return f instanceof File && f.type.startsWith('image/')
    })
    
    if (!arr.length) return
    setUploading(true)
    try {
      // Upload files sequentially to be gentle with server
      const uploadedUrls: string[] = []
      for (const f of arr) {
        const res = await api.uploads.uploadFile(f)
        if (res && res.url) uploadedUrls.push(res.url)
      }
      const next = [...images, ...uploadedUrls.map(u => ({ url: u }))]
      await notifyChange(next)
      toast({ status: 'success', description: `${uploadedUrls.length} image(s) ajoutée(s)` })
    } catch (err) {
      console.error('Upload failed', err)
      toast({ status: 'error', description: 'Echec de l\'upload' })
    } finally {
      setUploading(false)
    }
  }

  const remove = (idx: number) => { 
    const next = images.filter((_, i) => i !== idx)
    notifyChange(next) 
  }
  
  const move = (from: number, to: number) => {
    if (from === to) return
    const arr = [...images]
    const [it] = arr.splice(from, 1)
    arr.splice(to, 0, it)
    notifyChange(arr)
  }

  return (
    <VStack align="stretch" spacing={4}>
      <HStack spacing={3}>
        <Button 
          leftIcon={<FiUpload />} 
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.multiple = true
            input.onchange = (e: Event) => {
              const t = e.target as HTMLInputElement
              if (t.files) handleFiles(t.files)
            }
            input.click()
          }} 
          isLoading={uploading}
          colorScheme="brand"
        >
          Ajouter des images
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => { 
            setImages([])
            if (onChange) onChange([]) 
          }}
          isDisabled={images.length === 0}
        >
          Supprimer toutes
        </Button>
      </HStack>

      {images.length === 0 ? (
        <Box 
          border="2px dashed" 
          borderColor="gray.300"
          p={8} 
          textAlign="center"
          borderRadius="md"
        >
          <Text color="gray.500">Aucune image • Cliquez sur "Ajouter des images"</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 3, md: 4 }} spacing={3}>
          {images.map((it, idx) => (
            <Box 
              key={idx} 
              position="relative" 
              borderRadius="md" 
              overflow="hidden" 
              border="1px solid" 
              borderColor="gray.200"
              _hover={{ borderColor: 'brand.400' }}
              transition="all 0.2s"
            >
              <Image 
                src={highRes(it.url, { width: 800 }) ?? it.url} 
                alt={`Image ${idx + 1}`} 
                objectFit="cover" 
                width="100%" 
                height="120px" 
              />
              
              {/* Bouton supprimer */}
              <Icon 
                as={FiX} 
                boxSize={5} 
                color="white" 
                bg="red.500" 
                p={1} 
                borderRadius="full" 
                cursor="pointer" 
                onClick={() => remove(idx)}
                position="absolute"
                top={2}
                right={2}
                _hover={{ bg: 'red.600', transform: 'scale(1.1)' }}
                transition="all 0.2s"
              />
              
              {/* Boutons réorganiser */}
              <HStack 
                position="absolute" 
                left={2} 
                bottom={2} 
                spacing={1}
              >
                {idx > 0 && (
                  <Icon 
                    as={FiChevronLeft} 
                    boxSize={5} 
                    color="white" 
                    bg="blackAlpha.700" 
                    p={1} 
                    borderRadius="full" 
                    cursor="pointer" 
                    onClick={() => move(idx, idx - 1)}
                    _hover={{ bg: 'blackAlpha.800' }}
                    transition="all 0.2s"
                  />
                )}
                {idx < images.length - 1 && (
                  <Icon 
                    as={FiChevronRight} 
                    boxSize={5} 
                    color="white" 
                    bg="blackAlpha.700" 
                    p={1} 
                    borderRadius="full" 
                    cursor="pointer" 
                    onClick={() => move(idx, idx + 1)}
                    _hover={{ bg: 'blackAlpha.800' }}
                    transition="all 0.2s"
                  />
                )}
              </HStack>
              
              {/* Badge position */}
              {idx === 0 && (
                <Box
                  position="absolute"
                  top={2}
                  left={2}
                  bg="brand.500"
                  color="white"
                  fontSize="xs"
                  fontWeight="bold"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  Principal
                </Box>
              )}
            </Box>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  )
}