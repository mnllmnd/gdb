import { useState, useCallback } from 'react'

export function useCache() {
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState<any>(null)

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        // Force reload the page to get fresh data
        globalThis.location.reload()
      }
    } catch (err) {
      console.error('Failed to refresh cache:', err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const getStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/cache/status', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setStatus(data.status)
      }
    } catch (err) {
      console.error('Failed to get cache status:', err)
    }
  }, [])

  return { refresh, refreshing, status, getStatus }
}

export default useCache