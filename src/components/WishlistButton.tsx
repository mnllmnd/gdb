import { useState, useEffect } from 'react';
import { IconButton, Icon } from '@chakra-ui/react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../services/useAuth';
import { apiClient, api } from '../services/api';

interface WishlistButtonProps {
  productId: string;
  onToggle?: (isInWishlist: boolean) => void;
}

const WishlistButton = ({ productId, onToggle }: WishlistButtonProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [productId, user]);

  const checkWishlistStatus = async () => {
    try {
      const response = await apiClient.get(`/wishlist/${productId}/check`);
      setIsInWishlist(response.isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      // Handle not logged in case - maybe redirect to login or show a message
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await apiClient.delete(`/wishlist/${productId}`);
        // Try to unlike the product so the likes counter is kept in sync
        try {
          const res = await api.products.unlike(productId);
          const count = res && typeof res.count === 'number' ? res.count : undefined;
          try { globalThis.dispatchEvent(new CustomEvent('product:likesChanged', { detail: { productId, count } })) } catch (e) { /* ignore */ }
        } catch (e) {
          console.error('Failed to unlike product after removing from wishlist', e);
        }
      } else {
        await apiClient.post(`/wishlist/${productId}`);
        // Try to like the product so the likes counter is kept in sync
        try {
          const res = await api.products.like(productId);
          const count = res && typeof res.count === 'number' ? res.count : undefined;
          try { globalThis.dispatchEvent(new CustomEvent('product:likesChanged', { detail: { productId, count } })) } catch (e) { /* ignore */ }
        } catch (e) {
          console.error('Failed to like product after adding to wishlist', e);
        }
      }
      setIsInWishlist(!isInWishlist);
      if (onToggle) onToggle(!isInWishlist);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IconButton
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      icon={isInWishlist ? <Icon as={FaHeart} /> : <Icon as={FaRegHeart} />}
      onClick={toggleWishlist}
      isLoading={isLoading}
      color={isInWishlist ? 'red.500' : undefined}
      variant="ghost"
      _hover={{ bg: 'transparent', transform: 'scale(1.1)' }}
      transition="all 0.2s"
    />
  );
};

export default WishlistButton;