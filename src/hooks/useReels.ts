import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export default function useReels({ productId = null, page = 1, limit = 12 } = {}) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await api.reels.list({ product_id: productId, page: p, limit })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to load reels', err)
    } finally {
      setLoading(false)
    }
  }, [productId, page, limit])

  useEffect(() => { load(page) }, [load, page])

  return { items, loading, total, reload: () => load(page) }
}
