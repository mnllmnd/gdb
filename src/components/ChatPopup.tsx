import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Button, Input, VStack, Text, 
  Avatar, Badge, IconButton, Flex,
  useDisclosure, Card, CardBody,
  Image, HStack, Tag, CloseButton,
  Link, useBreakpointValue
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { API_ROOT } from '../services/api'

// Définition des types TypeScript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  shop?: any;
}

interface ChatMessage {
  from: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'recommendations' | 'error';
  intent?: string;
  emotion?: string;
  confidence?: number;
  products?: Product[];
}

export const ChatPopup = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      from: 'bot', 
      text: 'Bonjour ! 👋 Je suis votre assistant shopping. Je peux vous aider à trouver des produits sur notre plateforme. Que cherchez-vous ?',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [emotion, setEmotion] = useState('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Changement ici : defaultIsOpen: false au lieu de true
  const { isOpen, onToggle, onClose } = useDisclosure({ defaultIsOpen: false });

  // Utilisation de useBreakpointValue pour détecter les mobiles
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ajuster la hauteur quand le clavier s'ouvre sur mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      // Forcer le scroll vers le bas quand la hauteur change
      setTimeout(scrollToBottom, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Fonction pour chercher les vrais produits de l'API
  const searchRealProducts = async (searchTerm: string) => {
    try {
        const response = await axios.get(`${API_ROOT}/api/products?search=${encodeURIComponent(searchTerm)}&limit=4`);
      return response.data.products || response.data || [];
    } catch (error) {
      console.error('Erreur recherche produits:', error);
      return [];
    }
  };

  // Fonction pour obtenir les produits populaires
  const getPopularProducts = async () => {
    try {
        const response = await axios.get(`${API_ROOT}/api/products?sort=popular&limit=4`);
      return response.data.products || response.data || [];
    } catch (error) {
      console.error('Erreur produits populaires:', error);
      return [];
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      from: 'user',
      text: input,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
  const res = await axios.post(`${API_ROOT}/api/message`, {
        message: input,
        userProfile: { 
          preferences: ['décoration', 'mobilier'],
          budget: 200,
          history: []
        }
      });

      const botResponse: ChatMessage = {
        from: 'bot',
        text: res.data.answer,
        timestamp: new Date(),
        type: 'text',
        emotion: res.data.emotion,
        intent: res.data.intent,
        confidence: res.data.confidence
      };

      setMessages(prev => [...prev, botResponse]);
      setEmotion(res.data.emotion);
      
      // Si c'est une recherche de produit, chercher les VRAIS produits
      let realProducts: Product[] = [];
      
      if (res.data.intent === 'recherche_produit' || res.data.intent === 'recommandation') {
        // Extraire les mots-clés de la recherche
        const searchKeywords = extractSearchKeywords(input);
        
        if (searchKeywords.length > 0) {
          realProducts = await searchRealProducts(searchKeywords.join(' '));
        } else {
          // Si pas de mots-clés spécifiques, montrer les produits populaires
          realProducts = await getPopularProducts();
        }
        
        setRecommendations(realProducts);
        
        // Message de recommandations avec les VRAIS produits
        if (realProducts.length > 0) {
          const recommendationMessage: ChatMessage = {
            from: 'bot',
            text: `J'ai trouvé ${realProducts.length} produit(s) correspondant à votre recherche :`,
            timestamp: new Date(),
            type: 'recommendations',
            products: realProducts
          };
          setMessages(prev => [...prev, recommendationMessage]);
        } else {
          const noResultsMessage: ChatMessage = {
            from: 'bot',
            text: "Je n'ai pas trouvé de produits correspondant à votre recherche. Essayez avec d'autres termes ou parcourez notre catalogue complet !",
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, noResultsMessage]);
        }
      } else {
        setRecommendations([]);
      }

    } catch (err) {
      console.error('Erreur chat:', err);
      const errorMessage: ChatMessage = {
        from: 'bot',
        text: "Désolé, je rencontre des difficultés techniques. Pouvez-vous réessayer ?",
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour extraire les mots-clés de recherche du message
  const extractSearchKeywords = (message: string): string[] => {
    const stopWords = ['je', 'tu', 'il', 'nous', 'vous', 'ils', 'cherche', 'veux', 'voudrais', 'recherche', 'acheter', 'trouver', 'des', 'un', 'une', 'le', 'la', 'les', 'du', 'de', 'pour', 'dans', 'sur'];
    
    const words = message.toLowerCase()
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
    
    return words;
  };

  const getEmotionColor = (emotion?: string) => {
    const colors: { [key: string]: string } = {
      happy: 'green.100',
      excited: 'purple.100',
      satisfied: 'blue.100',
      curious: 'yellow.100',
      confused: 'orange.100',
      urgent: 'red.100',
      neutral: 'gray.100'
    };
    return colors[emotion || 'neutral'] || 'gray.100';
  };

  const getIntentBadge = (intent?: string) => {
    const intents: { [key: string]: { label: string; color: string } } = {
      salutation: { label: '👋 Salutation', color: 'blue' },
      recherche_produit: { label: '🛍️ Recherche', color: 'green' },
      recommandation: { label: '💡 Recommandation', color: 'purple' },
      prix_promotion: { label: '💰 Prix', color: 'orange' },
      livraison_info: { label: '🚚 Livraison', color: 'teal' },
      merci: { label: '🙏 Merci', color: 'pink' }
    };
    return intents[intent || ''] || { label: intent || 'Unknown', color: 'gray' };
  };

  const clearChat = () => {
    setMessages([
      { 
        from: 'bot', 
        text: 'Bonjour ! 👋 Comment puis-je vous aider à trouver des produits ?',
        timestamp: new Date(),
        type: 'text'
      }
    ]);
    setRecommendations([]);
    setEmotion('neutral');
  };

  // Fonction pour obtenir l'URL de l'image du produit
  const getProductImageUrl = (product: Product) => {
    if (product.image) {
      return product.image.startsWith('http') 
        ? product.image 
        : `${API_ROOT}${product.image}`;
    }
    return null;
  };

  if (!isOpen) {
    return (
      <Box 
        position="fixed" 
        bottom={isMobile ? "20px" : "20px"} 
        right={isMobile ? "20px" : "20px"} 
        zIndex={9999}
      >
        <Button
          onClick={onToggle}
          colorScheme="blue"
          size={isMobile ? "lg" : "lg"}
          borderRadius="full"
          boxShadow="2xl"
          width={isMobile ? "60px" : "60px"}
          height={isMobile ? "60px" : "60px"}
          fontSize={isMobile ? "xl" : "2xl"}
        >
          💬
        </Button>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      bottom={isMobile ? "80px" : "20px"} // Changement ici : plus d'espace en bas sur mobile
      right={isMobile ? "20px" : "20px"}
      width={isMobile ? "calc(100% - 40px)" : "420px"} // Changement ici : largeur réduite sur mobile
      height={isMobile ? "70vh" : "600px"} // Changement ici : hauteur réduite à 70% sur mobile
      bg="white"
      borderRadius="xl" // Toujours des bordures arrondies
      boxShadow="2xl"
      zIndex={9999}
      display="flex"
      flexDirection="column"
      border="1px solid"
      borderColor="gray.200"
      maxWidth={isMobile ? "400px" : "none"} // Largeur max sur mobile
      margin={isMobile ? "0 auto" : "0"} // Centrer sur mobile si nécessaire
      left={isMobile ? "20px" : "auto"} // Positionnement sur mobile
    >
      {/* Header */}
      <Flex
        bg="blue.500"
        color="white"
        p={3}
        borderTopRadius="xl"
        justify="space-between"
        align="center"
        flexShrink={0}
      >
        <HStack>
          <Avatar size="sm" name="Assistant IA" bg="blue.300" />
          <Box>
            <Text fontWeight="bold">Assistant Shopping</Text>
            <Text fontSize="xs" opacity={0.8}>
              {emotion === 'happy' ? '😊 Disponible' : 
               emotion === 'excited' ? '🚀 Super motivé' : '💬 En ligne'}
            </Text>
          </Box>
        </HStack>
        <HStack>
          <IconButton
            icon={isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
            onClick={onToggle}
            size="sm"
            variant="ghost"
            color="white"
            aria-label="Toggle chat"
          />
          <CloseButton onClick={onClose} />
        </HStack>
      </Flex>

      {/* Messages */}
      <Box 
        flex="1" 
        p={isMobile ? 3 : 4} 
        overflowY="auto" 
        bg="gray.50"
        pb={isMobile ? "70px" : 4} // Réduction de l'espace en bas sur mobile
        minHeight={0}
      >
        <VStack spacing={2} align="stretch">
          {messages.map((msg, i) => (
            <Box
              key={i}
              alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
              maxWidth={isMobile ? "90%" : "85%"}
            >
              <Flex align="flex-end" gap={2} direction={msg.from === 'user' ? 'row-reverse' : 'row'}>
                <Avatar
                  size="xs"
                  name={msg.from === 'user' ? 'Vous' : 'Assistant'}
                  bg={msg.from === 'user' ? 'green.500' : 'blue.500'}
                />
                <Box
                  bg={msg.from === 'user' ? 'blue.500' : getEmotionColor(msg.emotion)}
                  color={msg.from === 'user' ? 'white' : 'gray.800'}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  borderBottomRightRadius={msg.from === 'user' ? 0 : 'lg'}
                  borderBottomLeftRadius={msg.from === 'user' ? 'lg' : 0}
                >
                  <Text fontSize="sm">{msg.text}</Text>
                  {msg.type === 'recommendations' && msg.products && (
                    <VStack mt={3} spacing={3}>
                      {msg.products.map((product, idx) => {
                        const imageUrl = getProductImageUrl(product);
                        return (
                          <Card key={idx} size="sm" width="100%" variant="outline">
                            <CardBody p={isMobile ? 2 : 3}>
                              <HStack spacing={isMobile ? 2 : 3} align="start">
                                <Box 
                                  width={isMobile ? "40px" : "50px"} 
                                  height={isMobile ? "40px" : "50px"} 
                                  bg="gray.100" 
                                  borderRadius="md"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexShrink={0}
                                >
                                  {imageUrl ? (
                                    <Image 
                                      src={imageUrl} 
                                      alt={product.name}
                                      width="100%"
                                      height="100%"
                                      objectFit="cover"
                                      borderRadius="md"
                                      fallback={
                                        <Text fontSize="xs" color="gray.500">🛍️</Text>
                                      }
                                    />
                                  ) : (
                                    <Text fontSize="xs" color="gray.500">🛍️</Text>
                                  )}
                                </Box>
                                <Box flex="1">
                                  <Text fontSize="sm" fontWeight="bold" noOfLines={2} mb={1}>
                                    {product.name}
                                  </Text>
                                  <Box 
                                    bg="green.50" 
                                    display="inline-block" 
                                    px={2} 
                                    py={1} 
                                    borderRadius="md"
                                    mb={1}
                                  >
                                    <Text 
                                      fontSize="md" 
                                      color="green.700" 
                                      fontWeight="bold"
                                    >
                                      {Math.floor(product.price)} FCFA
                                    </Text>
                                  </Box>
                                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {product.category}
                                  </Text>
                                  <Link 
                                    href={`/products/${product.id}`} 
                                    fontSize="xs" 
                                    color="blue.500"
                                    onClick={() => window.open(`/products/${product.id}`, '_blank')}
                                  >
                                    Voir le produit →
                                  </Link>
                                </Box>
                              </HStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </VStack>
                  )}
                  <Text fontSize="xs" opacity={0.7} mt={1}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Box>
              </Flex>
              {msg.intent && (
                <Badge 
                  colorScheme={getIntentBadge(msg.intent).color} 
                  size="sm" 
                  mt={1}
                  ml={msg.from === 'user' ? 0 : 8}
                  mr={msg.from === 'user' ? 8 : 0}
                >
                  {getIntentBadge(msg.intent).label}
                </Badge>
              )}
            </Box>
          ))}
          
          {isLoading && (
            <Box alignSelf="flex-start" maxWidth="80%">
              <Flex align="flex-end" gap={2}>
                <Avatar size="xs" name="Assistant" bg="blue.500" />
                <Box bg="gray.100" px={3} py={2} borderRadius="lg">
                  <Text fontSize="sm">🔍 Je recherche dans notre catalogue...</Text>
                </Box>
              </Flex>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Recommendations en cours */}
      {recommendations.length > 0 && (
        <Box 
          p={3} 
          borderTop="1px solid" 
          borderColor="gray.200" 
          bg="blue.50"
          flexShrink={0}
        >
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            🛍️ Produits trouvés ({recommendations.length})
          </Text>
          <HStack spacing={2} overflowX="auto">
            {recommendations.slice(0, 3).map((product, idx) => (
              <Tag key={idx} colorScheme="blue" size="sm" borderRadius="full">
                {product.name}
              </Tag>
            ))}
          </HStack>
        </Box>
      )}

      {/* Zone de saisie */}
      <Box 
        p={3} 
        borderTop="1px solid" 
        borderColor="gray.200" 
        bg="white"
        flexShrink={0}
      >
        <HStack>
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isLoading && sendMessage()}
            placeholder="Ex: Je cherche une lampe scandinave..."
            size="sm"
            isDisabled={isLoading}
            fontSize="16px"
          />
          <Button
            onClick={sendMessage}
            colorScheme="blue"
            size="sm"
            isLoading={isLoading}
            loadingText="..."
            flexShrink={0}
            minWidth="70px"
          >
            Envoyer
          </Button>
        </HStack>
        <Flex justify="space-between" mt={2}>
          <Text fontSize="xs" color="gray.500">
            💡 Essayez: "meuble", "décoration", "électroménager"
          </Text>
          <Button size="xs" variant="ghost" onClick={clearChat}>
            Effacer
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};