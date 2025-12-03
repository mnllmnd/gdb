import React, { useEffect, useState, useRef } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Tooltip,
  useToast,
  TableContainer,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  VStack,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Card,
  CardHeader,
  CardBody,
  Flex,
  IconButton,
  Badge,
  useBreakpointValue,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, AddIcon, StarIcon } from '@chakra-ui/icons'
import api from '../services/api'
import { getItem } from '../utils/localAuth'
import useCache from '../hooks/useCache'

interface User {
  id: string
  email?: string
  phone?: string
  display_name?: string
  role: string
}

interface Shop {
  id: string
  name?: string
  domain?: string
  owner?: User
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState({ email: '', phone: '', display_name: '', password: '' })
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState({ users: false })

  const toast = useToast()
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' })

  const { isOpen: isUserOpen, onOpen: onUserOpen, onClose: onUserClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  const cancelRef = useRef<HTMLButtonElement>(null)

  const bgGradient = useColorModeValue(
    'linear(to-br, brand.500, brand.600)',
    'linear(to-br, gray.800, gray.900)'
  )
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400')

  useEffect(() => {
    loadInitialData()
  }, [toast])

  const loadInitialData = async () => {
    setIsLoading(prev => ({ ...prev, users: true }))
    
    try {
      await loadUsers()
    } finally {
      setIsLoading(prev => ({ ...prev, users: false }))
    }
  }

  const loadUsers = async () => {
    const token = getItem('token')
    try {
      const res = await api.admin.users(token ?? undefined)
      setUsers(res)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const promoteAdmin = async (id: string) => {
    const token = getItem('token')
    try {
      await api.admin.setRole(id, 'admin', token ?? undefined)
      toast({
        title: 'Promotion réussie',
        description: 'L\'utilisateur a été promu administrateur',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, role: 'admin' } : u)))
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erreur',
        description: 'Impossible de promouvoir cet utilisateur',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const createUser = async () => {
    const token = getItem('token')
    try {
      await api.admin.createUser(newUser, token ?? undefined)
      toast({ 
        title: 'Utilisateur créé', 
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onUserClose()
      setNewUser({ email: '', phone: '', display_name: '', password: '' })
      await loadUsers()
    } catch (e) {
      console.error(e)
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de créer l\'utilisateur', 
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const deleteUser = async (id: string) => {
    const token = getItem('token')
    try {
      await api.admin.deleteUser(id, token ?? undefined)
      toast({
        title: 'Utilisateur supprimé',
        description: 'L\'utilisateur et toutes ses données associées ont été supprimés',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      setUsers(prev => prev.filter(u => u.id !== id))
      onDeleteClose()
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erreur',
        description: e?.error === 'Cannot delete your own account'
          ? 'Vous ne pouvez pas supprimer votre propre compte'
          : 'Impossible de supprimer cet utilisateur',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    onDeleteOpen()
  }

  const getRoleBadge = (role: string) => {
    const colorScheme = role === 'admin' ? 'purple' : 'gray'
    return (
      <Badge colorScheme={colorScheme} variant="subtle" px={2} py={1} borderRadius="full">
        {role}
      </Badge>
    )
  }

  return (
    <Box bgGradient={bgGradient} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={3} color="white" fontWeight="bold">
              Panneau d'Administration
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="2xl">
              Gérez les utilisateurs, leurs rôles et les boutiques de votre plateforme.
            </Text>
          </Box>

          {/* Users Section */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px solid" borderColor={borderColor}>
            <CardHeader pb={4}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <Box>
                  <Heading size="md" color={textColor}>Utilisateurs</Heading>
                  <Text color={mutedTextColor} fontSize="sm">
                    {users.length} utilisateur(s) au total
                  </Text>
                </Box>
                <Button 
                  leftIcon={<AddIcon />} 
                  colorScheme="brand" 
                  onClick={onUserOpen}
                  size="md"
                >
                  Nouvel utilisateur
                </Button>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <TableContainer>
                <Table variant="simple" size={tableSize}>
                  <Thead>
                    <Tr>
                      <Th color={mutedTextColor}>UID</Th>
                      <Th color={mutedTextColor}>Nom</Th>
                      <Th color={mutedTextColor}>Téléphone</Th>
                      <Th color={mutedTextColor}>Rôle</Th>
                      <Th textAlign="center" color={mutedTextColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map(user => (
                      <Tr key={user.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }} transition="background 0.2s">
                        <Td>
                          <Tooltip label={user.id} hasArrow>
                            <Text fontFamily="mono" fontSize="sm" color={mutedTextColor}>
                              {user.id.slice(0, 8)}...
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td fontWeight="medium">{user.display_name || '-'}</Td>
                        <Td>
                          <Text fontSize="sm">{user.phone || '-'}</Text>
                        </Td>
                        <Td>{getRoleBadge(user.role)}</Td>
                        <Td>
                          <HStack spacing={2} justify="center">
                            {user.role !== 'admin' && (
                              <Tooltip label="Promouvoir administrateur" hasArrow>
                                <IconButton
                                  aria-label="Promouvoir admin"
                                  icon={<StarIcon />}
                                  colorScheme="orange"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => promoteAdmin(user.id)}
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Supprimer l'utilisateur" hasArrow>
                              <IconButton
                                aria-label="Supprimer utilisateur"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(user)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

        </VStack>

        {/* Delete User Dialog */}
        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent bg={cardBg} borderRadius="xl">
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={textColor}>
                <HStack>
                  <DeleteIcon color="red.500" />
                  <Text>Supprimer l'utilisateur</Text>
                </HStack>
              </AlertDialogHeader>
              <AlertDialogBody color={mutedTextColor}>
                Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?
                <VStack align="start" mt={4} spacing={2} bg={useColorModeValue('red.50', 'red.900')} p={3} borderRadius="md">
                  <Text fontWeight="medium">Cette action supprimera :</Text>
                  <Text>• Le compte de {userToDelete?.display_name || userToDelete?.email}</Text>
                  <Text>• Toutes ses boutiques associées</Text>
                  <Text>• Tous ses produits et commandes</Text>
                </VStack>
                <Text mt={4} color="red.500" fontWeight="bold" fontSize="sm">
                  ⚠️ Cette action est irréversible
                </Text>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose} variant="outline">
                  Annuler
                </Button>
                <Button 
                  colorScheme="red" 
                  ml={3} 
                  leftIcon={<DeleteIcon />} 
                  onClick={() => userToDelete && deleteUser(userToDelete.id)}
                >
                  Supprimer définitivement
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Create User Modal */}
        <Modal isOpen={isUserOpen} onClose={onUserClose} isCentered size="lg">
          <ModalOverlay />
          <ModalContent bg={cardBg} borderRadius="xl">
            <ModalHeader borderBottom="1px solid" borderColor={borderColor} color={textColor}>
              Créer un nouvel utilisateur
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel color={textColor}>Nom d'affichage</FormLabel>
                  <Input 
                    value={newUser.display_name} 
                    onChange={e => setNewUser(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Entrez le nom complet"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Adresse email</FormLabel>
                  <Input 
                    type="email"
                    value={newUser.email} 
                    onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="utilisateur@exemple.com"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Numéro de téléphone</FormLabel>
                  <Input 
                    value={newUser.phone} 
                    onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+33 1 23 45 67 89"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Mot de passe</FormLabel>
                  <Input 
                    type="password" 
                    value={newUser.password} 
                    onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Choisissez un mot de passe sécurisé"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor}>
              <Button variant="outline" mr={3} onClick={onUserClose}>
                Annuler
              </Button>
              <Button colorScheme="brand" onClick={createUser}>
                Créer l'utilisateur
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  )
}


function AdminPanel() {
  const { refresh, refreshing, status, getStatus } = useCache()

  return (
    <div>
      <button onClick={refresh} disabled={refreshing}>
        {refreshing ? 'Rafraîchissement...' : 'Rafraîchir le cache'}
      </button>
      {status && (
        <div>
          <p>Dernière mise à jour : {new Date(status.version).toLocaleString()}</p>
          <p>Age du cache : {Math.round(status.age / 1000)} secondes</p>
        </div>
      )}
    </div>
  )
}