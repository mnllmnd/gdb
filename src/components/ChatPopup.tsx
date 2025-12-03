import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Button, Input, VStack, Text, 
  Flex, useDisclosure, 
  Image, HStack, useBreakpointValue,
  useColorModeValue
} from '@chakra-ui/react';
import { CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { API_ROOT } from '../services/api'
import api from '../services/api'

interface Product {
  id: number;
  name?: string;
  title?: string;
  product_name?: string;
  price?: number;
  category?: string;
  image?: string;
  image_url?: string;
  product_image?: string;
}

interface ChatMessage {
  from: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'recommendations' | 'error';
  intent?: string;
  emotion?: string;
  products?: Product[];
}

export const ChatPopup = () => {
  const STORAGE_KEY = 'chat:messages'
  
  // 🔧 COULEURS ADAPTATIVES
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const userMessageTextColor = useColorModeValue('white', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.800');
  const mine = useColorModeValue('orange.500', 'gray.900');
  const inputBg = useColorModeValue('white', 'gray.800');
  const inputBorder = useColorModeValue('gray.300', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.900');
  const buttonBg = useColorModeValue('gray.900', 'gray.900');
  const buttonHover = useColorModeValue('gray.800', 'gray.600');
  const productCardBg = useColorModeValue('white', 'gray.800');
  const productCardBorder = useColorModeValue('gray.200', 'gray.600');
  const productCardHover = useColorModeValue('black', 'gray.900');
  const productPriceBg = useColorModeValue('gray.50', 'gray.900');
  const productPriceColor = useColorModeValue('black', 'white');
  const loadingBg = useColorModeValue('gray.50', 'gray.900');
  
  const loadInitialMessages = (): ChatMessage[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return [{ 
        from: 'bot', 
        text: 'Bonjour. Je suis votre assistant. Que recherchez-vous ?', 
        timestamp: new Date(), 
        type: 'text' as const 
      } as ChatMessage]
      const parsed = JSON.parse(raw)
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
    } catch (err) {
      return [{ 
        from: 'bot', 
        text: 'Bonjour. Je suis votre assistant. Que recherchez-vous ?', 
        timestamp: new Date(), 
        type: 'text' as const 
      } as ChatMessage]
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>(loadInitialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isOpen, onToggle, onClose } = useDisclosure({ defaultIsOpen: false });
  const isMobile = useBreakpointValue({ base: true, md: false });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (err) {
      console.error('Failed to save chat history', err)
    }
  }, [messages])

  const searchRealProducts = async (searchTerm: string) => {
    try {
      const response = await axios.get(`${API_ROOT}/api/products?search=${encodeURIComponent(searchTerm)}&limit=4`);
      return response.data.products || response.data || [];
    } catch (error) {
      return [];
    }
  };

  const recCache = React.useRef<Record<string, { ts: number; results: Product[] }>>({});
  const CACHE_TTL = 1000 * 60 * 5

  const fetchRecommendations = async (text: string) => {
    const key = (text || '').trim().toLowerCase();
    if (!key) return [] as Product[];
    const cached = recCache.current[key];
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
      return cached.results
    }

    try {
      const payload: any = { text: key }
      const res: any = await api.recommend.find(payload)
      const results: Product[] = res?.results || []
      recCache.current[key] = { ts: Date.now(), results }
      return results
    } catch (err) {
      return []
    }
  }

  const getPopularProducts = async () => {
    try {
      const response = await axios.get(`${API_ROOT}/api/products?sort=popular&limit=4`);
      return response.data.products || response.data || [];
    } catch (error) {
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
        intent: res.data.intent
      };

      setMessages(prev => [...prev, botResponse]);
      
      if (res.data.intent === 'recherche_produit' || res.data.intent === 'recommandation') {
        const queryText = input.trim()
        let recResults: Product[] = await fetchRecommendations(queryText)

        if (!recResults || recResults.length === 0) {
          const searchKeywords = extractSearchKeywords(input);
          if (searchKeywords.length > 0) {
            recResults = await searchRealProducts(searchKeywords.join(' '));
          } else {
            recResults = await getPopularProducts();
          }
        }

        setRecommendations(recResults);

        if (recResults.length > 0) {
          const recommendationMessage: ChatMessage = {
            from: 'bot',
            text: `J'ai trouvé ${recResults.length} produit(s) :`,
            timestamp: new Date(),
            type: 'recommendations',
            products: recResults
          };
          setMessages(prev => [...prev, recommendationMessage]);
        } else {
          const noResultsMessage: ChatMessage = {
            from: 'bot',
            text: "Aucun produit trouvé. Essayez d'autres termes.",
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, noResultsMessage]);
        }
      } else {
        setRecommendations([]);
      }

    } catch (err) {
      const errorMessage: ChatMessage = {
        from: 'bot',
        text: "Désolé, réessayez.",
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractSearchKeywords = (message: string): string[] => {
    const stopWords = ['je', 'tu', 'il', 'nous', 'vous', 'ils', 'cherche', 'veux', 'voudrais', 'recherche', 'acheter', 'trouver'];
    
    const words = message.toLowerCase()
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
    
    return words;
  };

  const clearChat = () => {
    const initial = [{ 
      from: 'bot', 
      text: 'Bonjour. Que recherchez-vous ?', 
      timestamp: new Date(), 
      type: 'text' as const 
    } as ChatMessage]
    setMessages(initial);
    try { localStorage.removeItem(STORAGE_KEY) } catch(e){}
    setRecommendations([]);
  };

  const getProductImageUrl = (product: Product) => {
    const src = product.image_url || product.product_image || product.image || null
    if (!src) return null
    if (src.startsWith('http')) return src
    const root = API_ROOT.replace(/\/api$/, '')
    return `${root}${src.startsWith('/') ? src : '/' + src}`
  };

  // 🔴 BOUTON FLOTTANT - ADAPTÉ MODE SOMBRE
  if (!isOpen) {
    return (
      <Box 
        position="fixed" 
        bottom={isMobile ? "80px" : "24px"}
        left={isMobile ? "20px" : "24px"}
        zIndex={9999}
      >
        <Box
          onClick={onToggle}
          width="52px"
          height="52px"
          bg={buttonBg}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          boxShadow="0 4px 20px rgba(0,0,0,0.15)"
          transition="all 0.2s"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
            bg: buttonHover
          }}
        >
          <Text color="white" fontSize="18px" fontWeight="400" fontFamily="'Inter', sans-serif">
            AI
          </Text>
        </Box>
      </Box>
    );
  }

  // 🪟 FENÊTRE DE CHAT - COMPLÈTEMENT ADAPTATIVE
  return (
    <Box
      position="fixed"
      bottom={isMobile ? "80px" : "24px"}
      left={isMobile ? "20px" : "24px"}
      width={isMobile ? "calc(100% - 40px)" : "380px"}
      height={isMobile ? "70vh" : "520px"}
      bg={bgColor}
      borderRadius="0"
      boxShadow="0 8px 40px rgba(0,0,0,0.12)"
      zIndex={9999}
      display="flex"
      flexDirection="column"
      border="1px solid"
      borderColor={borderColor}
      maxWidth={isMobile ? "400px" : "none"}
      margin={isMobile ? "0 auto" : "0"}
      overflow="hidden"
      fontFamily="'Inter', sans-serif"
    >
      {/* Header ultra minimal */}
      <Flex
        bg={bgColor}
        p={3}
        borderBottom="1px solid"
        borderColor={borderColor}
        justify="space-between"
        align="center"
        height="56px"
      >
        <HStack spacing={3}>
          <Box 
            width="8px" 
            height="8px" 
            borderRadius="full" 
            bg="#10b981"
          />
          <Text 
            fontSize="14px" 
            fontWeight="500" 
            letterSpacing="0.5px"
            color={textColor}
          >
            Assistant
          </Text>
        </HStack>
        
        <HStack spacing={2}>
          <Box
            width="28px"
            height="28px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            borderRadius="sm"
            _hover={{ bg: hoverBg }}
            onClick={clearChat}
          >
            <Text fontSize="11px" color={mutedTextColor}>Effacer</Text>
          </Box>
          <Box
            width="28px"
            height="28px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            borderRadius="sm"
            _hover={{ bg: hoverBg }}
            onClick={onToggle}
          >
            <ChevronDownIcon color={mutedTextColor} w={3} h={3} />
          </Box>
          <Box
            width="28px"
            height="28px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            borderRadius="sm"
            _hover={{ bg: hoverBg }}
            onClick={onClose}
          >
            <CloseIcon color={mutedTextColor} w={2.5} h={2.5} />
          </Box>
        </HStack>
      </Flex>

      {/* Messages - Adaptatif */}
      <Box 
        flex="1" 
        p={4} 
        overflowY="auto" 
        bg={bgColor}
        pb={isMobile ? "80px" : 4}
      >
        <VStack spacing={4} align="stretch">
          {messages.map((msg, i) => (
            <Box
              key={i}
              alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
              maxWidth="85%"
            >
              <Flex align="flex-end" gap={3} direction={msg.from === 'user' ? 'row-reverse' : 'row'}>
                {msg.from === 'bot' && (
                  <Box 
                    width="24px" 
                    height="24px" 
                    borderRadius="full" 
                    bg={cardBg}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Text fontSize="10px" color={mutedTextColor}>AI</Text>
                  </Box>
                )}
                
                <Box
                  bg={msg.from === 'user' ? mine : cardBg}
                  color={msg.from === 'user' ? userMessageTextColor : 'white'}
                  px={4}
                  py={3}
                  borderRadius="2px"
                  position="relative"
                  border={msg.from === 'user' ? 'none' : '1px solid'}
                  borderColor={msg.from === 'user' ? 'transparent' : borderColor}
                  _before={msg.from === 'user' ? {
                    content: '""',
                    position: 'absolute',
                    right: '-8px',
                    bottom: '0',
                    width: '0',
                    height: '0',
                    borderLeft: `8px solid ${buttonBg}`,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent'
                  } : {
                    content: '""',
                    position: 'absolute',
                    left: '-8px',
                    bottom: '0',
                    width: '0',
                    height: '0',
                    borderRight: `8px solid ${cardBg}`,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent'
                  }}
                  _after={msg.from === 'user' ? {
                    content: '""',
                    position: 'absolute',
                    left: '-1px',
                    top: '-1px',
                    right: '-1px',
                    bottom: '-1px',
                    border: '1px solid',
                    borderColor: buttonBg,
                    borderRadius: '2px',
                    pointerEvents: 'none'
                  } : {}}
                >
                  <Text fontSize="14px" lineHeight="1.5">
                    {msg.text}
                  </Text>
                  
                  {msg.type === 'recommendations' && msg.products && (
                    <VStack spacing={3} mt={4}>
                      {msg.products.map((product, idx) => {
                        const imageUrl = getProductImageUrl(product);
                        return (
                          <Box 
                            key={idx} 
                            border="1px solid" 
                            borderColor={productCardBorder}
                            p={3}
                            bg={productCardBg}
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{
                              borderColor: productCardHover,
                              transform: 'translateX(1px)'
                            }}
                            onClick={() => window.open(`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${product.id}`, '_blank')}
                          >
                            <HStack spacing={3} align="start">
                              <Box 
                                width="60px" 
                                height="60px" 
                                bg={cardBg}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                                overflow="hidden"
                                border="1px solid"
                                borderColor={borderColor}
                              >
                                {imageUrl ? (
                                  <Image 
                                    src={imageUrl} 
                                    alt={product.name}
                                    width="100%"
                                    height="100%"
                                    objectFit="cover"
                                  />
                                ) : (
                                  <Box 
                                    width="100%" 
                                    height="100%" 
                                    bg={cardBg}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Text fontSize="10px" color={mutedTextColor}>PRODUIT</Text>
                                  </Box>
                                )}
                              </Box>
                              
                              <Box flex="1" minWidth="0">
                                <Text 
                                  fontSize="13px" 
                                  fontWeight="500" 
                                  mb={1}
                                  noOfLines={1}
                                  color={textColor}
                                >
                                  {product.name || product.title || product.product_name || 'Produit'}
                                </Text>
                                
                                <Box 
                                  bg={productPriceBg}
                                  display="inline-block"
                                  px={2}
                                  py={1}
                                  mb={1}
                                  borderRadius="1px"
                                >
                                  <Text 
                                    fontSize="15px" 
                                    fontWeight="600" 
                                    color={productPriceColor}
                                  >
                                    {new Intl.NumberFormat('fr-FR', { 
                                      maximumFractionDigits: 0 
                                    }).format(Math.floor(product.price || 0))} FCFA
                                  </Text>
                                </Box>
                                
                                <Text 
                                  fontSize="11px" 
                                  color={mutedTextColor}
                                  letterSpacing="0.3px"
                                  textTransform="uppercase"
                                >
                                  {product.category}
                                </Text>
                              </Box>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                  
                  <Text 
                    fontSize="11px" 
                    color={msg.from === 'user' ? 'gray.400' : mutedTextColor}
                    mt={2}
                    textAlign={msg.from === 'user' ? 'right' : 'left'}
                  >
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </Box>
                
                {msg.from === 'user' && (
                  <Box 
                    width="30px" 
                    height="30px" 
                    borderRadius="full" 
                    bg={mine}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Text fontSize="8px" color="white">VOUS</Text>
                  </Box>
                )}
              </Flex>
            </Box>
          ))}
          
          {isLoading && (
            <Box alignSelf="flex-start" maxWidth="85%">
              <Flex align="flex-end" gap={3}>
                <Box 
                  width="24px" 
                  height="24px" 
                  borderRadius="full" 
                  bg={loadingBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Text fontSize="10px" color={mutedTextColor}>AI</Text>
                </Box>
                <Box 
                  bg={loadingBg} 
                  px={4} 
                  py={3} 
                  borderRadius="2px"
                  position="relative"
                  border="1px solid"
                  borderColor={borderColor}
                  _before={{
                    content: '""',
                    position: 'absolute',
                    left: '-8px',
                    bottom: '0',
                    width: '0',
                    height: '0',
                    borderRight: `8px solid ${loadingBg}`,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent'
                  }}
                >
                  <Box display="flex" gap={1}>
                    {[1, 2, 3].map((dot) => (
                      <Box
                        key={dot}
                        width="4px"
                        height="4px"
                        borderRadius="full"
                        bg={mutedTextColor}
                        animation={`pulse 1.5s infinite ${dot * 0.2}s`}
                        sx={{
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 0.4 },
                            '50%': { opacity: 1 }
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Flex>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Zone de saisie - Adaptative */}
      <Box 
        p={4}
        borderTop="1px solid"
        borderColor={borderColor}
        bg={bgColor}
      >
        <HStack spacing={3}>
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isLoading && sendMessage()}
            placeholder="Rechercher un produit..."
            size="sm"
            isDisabled={isLoading}
            fontSize="14px"
            border="1px solid"
            borderColor={inputBorder}
            borderRadius="0"
            height="40px"
            bg={inputBg}
            color={textColor}
            _focus={{
              borderColor: useColorModeValue('black', 'white'),
              boxShadow: 'none'
            }}
            _placeholder={{
              color: mutedTextColor,
              fontSize: '13px'
            }}
            _disabled={{
              opacity: 0.6,
              cursor: 'not-allowed'
            }}
          />
          <Button
            onClick={sendMessage}
            bg={buttonBg}
            color="white"
            size="sm"
            isLoading={isLoading}
            loadingText=""
            height="40px"
            width="80px"
            borderRadius="0"
            fontSize="13px"
            fontWeight="500"
            letterSpacing="0.5px"
            _hover={{
              bg: buttonHover
            }}
            _active={{
              bg: buttonBg
            }}
            _loading={{
              opacity: 0.7
            }}
            _disabled={{
              opacity: 0.7,
              cursor: 'not-allowed'
            }}
          >
            Envoyer
          </Button>
        </HStack>
        
        <Text 
          fontSize="11px" 
          color={mutedTextColor} 
          mt={3}
          letterSpacing="0.3px"
        >
          Exemples: canapé, lampe, table, décoration
        </Text>
      </Box>
    </Box>
  );
};