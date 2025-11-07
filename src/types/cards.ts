// src/types/cards.ts
export interface ProductCardProps {
  id: string
  title?: string
  price?: string | number | null
  discount?: number  // Pourcentage de réduction
  originalPrice?: string | number | null  // Prix avant réduction
  image?: string
  image_url?: string
  shopName?: string
  shopDomain?: string
  height?: any
  featured?: boolean
  popular?: boolean
  showBadge?: boolean
  compact?: boolean
}

export interface ShopCardProps {
  id: string
  name: string
  description?: string
  image?: string
  compact?: boolean
  height?: any
  elevation?: 'sm' | 'md' | 'lg' | 'xl'
}