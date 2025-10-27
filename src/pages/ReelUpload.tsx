import React from 'react'
import { Container, Heading } from '@chakra-ui/react'
import ReelUploadForm from '../components/ReelUploadForm'

export default function ReelUpload() {
  return (
    <Container maxW="container.md" py={6}>
      <Heading mb={4}>Publier un reel</Heading>
      <ReelUploadForm />
    </Container>
  )
}
