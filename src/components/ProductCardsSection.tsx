import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Image,
  Badge,
  Icon,
  VStack,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  CardFooter,
  Fade,
  ScaleFade,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiExternalLink, FiStar } from 'react-icons/fi';

interface ProductCard {
  id: number;
  title: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl: string;
  badge?: string;
  badgeColor?: string;
  accentColor?: string;
}

interface ProductCardsSectionProps {
  products?: ProductCard[];
  title?: string;
  subtitle?: string;
}

const defaultProducts: ProductCard[] = [
  {
    id: 1,
    title: "Hisense Smart TV 4K",
    description: "Écran Ultra HD avec technologie HDR et Android TV intégré",
    price: 1200000,
    category: "Électronique",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    badge: "Nouveau",
    badgeColor: "blue",
    accentColor: "#3182CE",
  },
  {
    id: 2,
    title: "Sneakers Premium",
    description: "Chaussures de sport design avec amorti haute performance",
    price: 85000,
    category: "Mode",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    badge: "Populaire",
    badgeColor: "green",
    accentColor: "#38A169",
  },
  {
    id: 3,
    title: "Casque Audio Pro",
    description: "Réduction de bruit active et qualité audio studio",
    price: 95000,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    badge: "Édition Limitée",
    badgeColor: "purple",
    accentColor: "#805AD5",
  },
];

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ' F';
};

const ProductCardsSection: React.FC<ProductCardsSectionProps> = ({
  products = defaultProducts,
  title = "Produits Populaires",
  subtitle = "Découvrez notre sélection exclusive"
}) => {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);
  const columns = useBreakpointValue({
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  }) || 4;

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const titleColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    setVisibleCards(new Array(products.length).fill(true));
  }, [products.length]);

  return (
    <Box
      bg={bgColor}
      py={{ base: 12, md: 20 }}
      px={{ base: 4, md: 8, lg: 12 }}
      position="relative"
      overflow="hidden"
    >
      <Box
        maxW="container.xl"
        mx="auto"
        position="relative"
        zIndex={1}
      >
        <Fade in={visibleCards.some(Boolean)}>
          <VStack
            spacing={4}
            textAlign="center"
            mb={{ base: 8, md: 16 }}
            maxW="2xl"
            mx="auto"
          >
            <Heading
              size="2xl"
              color={titleColor}
              fontWeight="800"
              lineHeight="1.2"
            >
              {title}
            </Heading>
            <Text
              fontSize="lg"
              color={subtitleColor}
              maxW="lg"
              lineHeight="1.6"
            >
              {subtitle}
            </Text>
          </VStack>
        </Fade>

        <SimpleGrid
          columns={columns}
          spacing={{ base: 6, md: 8 }}
        >
          {products.map((product, index) => (
            <ScaleFade
              key={product.id}
              initialScale={0.95}
              in={visibleCards[index] || false}
              transition={{
                enter: {
                  duration: 0.6,
                  delay: index * 0.1
                }
              }}
            >
              <Card
                borderRadius="2xl"
                overflow="hidden"
                h="100%"
                transition="all 0.3s ease"
              >
                <Box
                  position="relative"
                  overflow="hidden"
                  h="220px"
                  bg={useColorModeValue('gray.50', 'gray.900')}
                >
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>

                <CardBody p={6}>
                  <VStack align="start" spacing={3}>
                    {product.category && (
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color={product.accentColor || 'brand.500'}
                        letterSpacing="0.5px"
                        textTransform="uppercase"
                      >
                        {product.category}
                      </Text>
                    )}

                    <Heading
                      size="md"
                      fontWeight="700"
                      lineHeight="1.3"
                      noOfLines={2}
                    >
                      {product.title}
                    </Heading>

                    {product.description && (
                      <Text
                        fontSize="sm"
                        noOfLines={2}
                        lineHeight="1.5"
                      >
                        {product.description}
                      </Text>
                    )}

                    <HStack w="100%" justify="space-between" pt={2}>
                      <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color={product.accentColor || 'brand.500'}
                      >
                        {formatPrice(product.price)}
                      </Text>
                      <Icon as={FiExternalLink} />
                    </HStack>
                  </VStack>
                </CardBody>

                <CardFooter pt={0} px={6} pb={6}>
                  <HStack
                    w="100%"
                    justify="space-between"
                    fontSize="sm"
                  >
                    <HStack spacing={1}>
                      <Icon as={FiStar} />
                      <Text>4.8</Text>
                    </HStack>
                    <Text fontSize="xs">Disponible</Text>
                  </HStack>
                </CardFooter>
              </Card>
            </ScaleFade>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default ProductCardsSection;
