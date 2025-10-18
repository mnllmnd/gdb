import React, { useEffect, useState } from 'react'
import { Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Button } from '@chakra-ui/react'
import api from '../services/api'
import { getItem } from '../utils/localAuth'


export default function Admin() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    async function loadUsers() {
      const token = getItem('token')
      const res = await api.admin.users(token ?? undefined)
      setUsers(res)
    }
    loadUsers()
  }, [])

  return (
    <Container py={8}>
      <Heading mb={4}>Panneau Admin</Heading>
      <Text mb={4}>Gérer les utilisateurs et les boutiques.</Text>
      <Table>
        <Thead>
          <Tr>
            <Th>UID</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((u) => (
            <Tr key={u.id}>
              <Td>{u.id}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              <Td>
                {u.role !== 'admin' && (
                  <Button onClick={async () => { const token = getItem('token'); await api.admin.setRole(u.id, 'admin', token ?? undefined); alert('Promu'); globalThis.location.reload(); }}>Promouvoir admin</Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Container>
  )
}
