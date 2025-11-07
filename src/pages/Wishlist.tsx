import { useEffect, useState } from 'react';
import { Box, Grid, Heading, Text, Container, useToast } from '@chakra-ui/react';
import { useAuth } from '../services/useAuth';
import { apiClient } from '../services/api';
import ProductCard from '../components/ProductCard';
import WishlistButton from '../components/WishlistButton';
import { Product } from '../types/cards';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/wishlist/me');
      setWishlistItems(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load wishlist items';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await apiClient.delete(`/wishlist/${productId}`);
      setWishlistItems(items => items.filter(item => item.id !== productId));
      toast({
        title: 'Success',
        description: 'Item removed from wishlist',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove item from wishlist';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Connectez-vous pour voir votre liste de souhaits.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Ma liste de souhaits</Heading>
      {(() => {
        if (isLoading) {
          return <Text>Chargement...</Text>;
        }
        
        if (wishlistItems.length === 0) {
          return <Text>Votre liste de souhaits est vide.</Text>;
        }
        
        return (
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
            {wishlistItems.map((item) => (
              <Box key={item.id} position="relative">
                <ProductCard
                  id={item.id}
                  title={item.name}
                  description={item.description}
                  price={item.price}
                  originalPrice={item.original_price}
                  discount={item.discount}
                  image_url={item.image_url}
                  shopName={item.shopName}
                  shopDomain={item.shopDomain}
                />
                <Box position="absolute" top={4} right={4}>
                  <WishlistButton
                    productId={item.id}
                    onToggle={(isInWishlist) => {
                      if (!isInWishlist) {
                        handleRemoveFromWishlist(item.id);
                      }
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Grid>
        );
      })()}
    </Container>
  );
};

export default Wishlist;