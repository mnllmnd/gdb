import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Button, Input, VStack, Text, 
  Flex, useDisclosure, 
  Image, HStack, useBreakpointValue,
  useColorModeValue, Switch
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

// Sous-composant FilterPanel - Extrait pour éviter les re-renders
const FilterPanel = React.memo(({ 
  mobile = false,
  budgetFilter,
  setBudgetFilter,
  inStockOnly,
  setInStockOnly,
  clearChat,
  colors
}: { 
  mobile?: boolean;
  budgetFilter: number | null;
  setBudgetFilter: (val: number | null) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  clearChat: () => void;
  colors: {
    textColor: string;
    mutedTextColor: string;
    inputBorder: string;
    hoverBg: string;
    borderColor: string;
  };
}) => (
  <Box>
    <Text fontSize={mobile ? "13px" : "12px"} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px" color={colors.textColor} mb={3}>
      Filtres
    </Text>

    {/* Budget Filter */}
    <Box mb={4}>
      <Text fontSize={mobile ? "12px" : "11px"} fontWeight="500" color={colors.mutedTextColor} mb={2}>Budget FCFA</Text>
      <Input
        value={budgetFilter ?? ''}
        onChange={e => {
          if (e.target.value === '') {
            setBudgetFilter(null);
          } else {
            const num = Number(e.target.value);
            if (!Number.isNaN(num) && num > 0) {
              setBudgetFilter(num);
            }
          }
        }}
        placeholder="Ex: 20000"
        size={mobile ? "sm" : "xs"}
        fontSize={mobile ? "12px" : "11px"}
        borderRadius="2px"
        border="1px solid"
        borderColor={colors.inputBorder}
        _focus={{
          borderColor: '#10b981',
          boxShadow: '0 0 0 1px #10b981',
          outlineOffset: '0'
        }}
      />
      {budgetFilter && (
        <Text fontSize={mobile ? "11px" : "10px"} color="#10b981" fontWeight="500" mt={2}>
          ≤ {new Intl.NumberFormat('fr-FR').format(budgetFilter)} FCFA
        </Text>
      )}
    </Box>

    {/* Stock Filter */}
    <Box mb={4}>
      <Text fontSize={mobile ? "12px" : "11px"} fontWeight="500" color={colors.mutedTextColor} mb={2}>Stock</Text>
      <HStack spacing={2} alignItems="center">
        <Switch 
          isChecked={inStockOnly} 
          onChange={e => setInStockOnly(e.target.checked)}
          size="md"
        />
        <Text fontSize={mobile ? "11px" : "10px"} color={inStockOnly ? "#10b981" : colors.mutedTextColor}>
          {inStockOnly ? 'En stock' : 'Tous'}
        </Text>
      </HStack>
    </Box>

    {/* Clear Button */}
    <Box>
      <Button
        size={mobile ? "sm" : "xs"}
        width="100%"
        bg={colors.hoverBg}
        border="1px solid"
        borderColor={colors.borderColor}
        color={colors.textColor}
        fontSize={mobile ? "12px" : "10px"}
        onClick={clearChat}
        _hover={{ bg: colors.borderColor }}
      >
        Effacer
      </Button>
    </Box>
  </Box>
));

FilterPanel.displayName = 'FilterPanel';

export const ChatPopup = () => {
  const STORAGE_KEY = 'chat:messages'
  const PREF_KEY = 'chat:preferences'
  
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
  const [budgetFilter, setBudgetFilter] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setBudgetFilter(parsed.budget ?? null);
        setInStockOnly(parsed.inStockOnly ?? false);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ budget: budgetFilter, inStockOnly }));
    } catch (e) {}
  }, [budgetFilter, inStockOnly]);
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

  /**
   * Recherche vectorielle avec hard filtering par catégorie
   */
  const vectorSearch = async (query: string, detectedCategory?: string | null) => {
    try {
      const response = await axios.post(`${API_ROOT}/api/vector-search`, {
        query: query.trim(),
        category: detectedCategory || null,
        limit: 8,
      });

      return {
        results: response.data.results || [],
        hasLowRelevance: response.data.hasLowRelevance || (response.data.bestScore && response.data.bestScore < 0.75),
        category: response.data.category,
        isTextFallback: response.data.isTextFallback,
        bestScore: response.data.bestScore,
      };
    } catch (error) {
      console.error('❌ Erreur recherche vectorielle:', error);
      return {
        results: [],
        hasLowRelevance: true,
        category: null,
        isTextFallback: false,
      };
    }
  };

  /**
   * Détecte la catégorie à partir de la requête utilisateur
   */
  const detectCategory = (query: string): string | null => {
    const categoryKeywords: Record<string, string[]> = {
      sac: ['sac', 'sacoche', 'cartable', 'besace', 'poche'],
      lampe: ['lampe', 'luminaire', 'suspension', 'applique', 'éclairage'],
      table: ['table', 'bureau', 'desk', 'plateau'],
      canapé: ['canapé', 'sofa', 'divan', 'fauteuil'],
      décoration: ['décor', 'déco', 'ornement', 'cadre', 'poster'],
      mobilier: ['meuble', 'chaise', 'tabouret', 'rangement'],
    };

    const queryLower = query.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => queryLower.includes(kw))) {
        return category;
      }
    }
    return null;
  };

  const fetchRecommendations = async (text: string) => {
    const key = (text || '').trim().toLowerCase();
    if (!key) return [] as Product[];
    const cached = recCache.current[key];
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
      return cached.results
    }

    try {
      // Première tentative: recherche vectorielle
      const detectedCategory = detectCategory(text);
      const vectorResult = await vectorSearch(text, detectedCategory);

      if (vectorResult.results.length > 0) {
        const results = vectorResult.results as Product[];
        recCache.current[key] = { ts: Date.now(), results };
        return results;
      }

      // Fallback: recommandation NLP classique
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
    const raw = input;
    const text = raw ? raw.trim() : '';
    if (!text) return;

    const userMessage: ChatMessage = {
      from: 'user',
      text: raw,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_ROOT}/api/message`, {
        message: text,
        userProfile: { 
          preferences: ['décoration', 'mobilier'],
          budget: budgetFilter ?? undefined,
          minPrice: undefined,
          maxPrice: undefined,
          inStockOnly: inStockOnly,
          history: []
        }
      });

      const botResponse: ChatMessage = {
        from: 'bot',
        text: (res.data.answer || '').toString().trim() || 'Je cherche...',
        timestamp: new Date(),
        type: 'text',
        emotion: res.data.emotion,
        intent: res.data.intent
      };

      // Ne pas afficher le message NLP pour les recherches (on va afficher nos propres messages)
      if (res.data.intent !== 'recherche_produit' && res.data.intent !== 'recommandation') {
        setMessages(prev => [...prev, botResponse]);
      }
      
      if (res.data.intent === 'recherche_produit' || res.data.intent === 'recommandation') {
        const queryText = text;
        const detectedCategory = detectCategory(queryText);
        
        // 🎯 Recherche vectorielle avec détection de catégorie
        let searchResult = await vectorSearch(queryText, detectedCategory);
        let recResults = searchResult.results as Product[];

        setRecommendations(recResults);

        // ⚠️ Gestion du message "No Match Detection"
        // Afficher le message d'erreur SEULEMENT si 0 résultats
        if (recResults.length === 0) {
          // Aucun résultat du tout
          const noResultsMessage: ChatMessage = {
            from: 'bot',
            text: "Je n'ai rien trouvé de vraiment proche de votre recherche. Essayez de préciser !",
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, noResultsMessage]);
        } else {
          // Résultats trouvés ✅ (peu importe le score/relevance)
          const recommendationMessage: ChatMessage = {
            from: 'bot',
            text: `J'ai trouvé ${recResults.length} produit(s) correspondant à votre recherche :`,
            timestamp: new Date(),
            type: 'recommendations',
            products: recResults
          };
          setMessages(prev => [...prev, recommendationMessage]);
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

  const getProductImageUrl = (product: Product) => {
    const src = product.image_url || product.product_image || product.image || null
    if (!src) return null
    if (src.startsWith('http')) return src
    const root = API_ROOT.replace(/\/api$/, '')
    return `${root}${src.startsWith('/') ? src : '/' + src}`
  };

  // Memoize callbacks pour FilterPanel
  const handleSetBudgetFilter = useCallback((val: number | null) => {
    setBudgetFilter(val);
  }, []);

  const handleSetInStockOnly = useCallback((val: boolean) => {
    setInStockOnly(val);
  }, []);

  const handleClearChat = useCallback(() => {
    const initial = [{ 
      from: 'bot', 
      text: 'Bonjour. Que recherchez-vous ?', 
      timestamp: new Date(), 
      type: 'text' as const 
    } as ChatMessage]
    setMessages(initial);
    try { localStorage.removeItem(STORAGE_KEY) } catch(e){}
    setRecommendations([]);
  }, []);

  // Memoize colors object
  const filterPanelColors = useMemo(() => ({
    textColor,
    mutedTextColor,
    inputBorder,
    hoverBg,
    borderColor
  }), [textColor, mutedTextColor, inputBorder, hoverBg, borderColor]);

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

  // 🪟 FENÊTRE DE CHAT - AVEC SIDEBAR POUR FILTRES
  return (
    <Box
      position="fixed"
      bottom={isMobile ? "80px" : "24px"}
      left={isMobile ? "10px" : "24px"}
      right={isMobile ? "10px" : "auto"}
      width={isMobile ? "auto" : "600px"}
      height={isMobile ? "75vh" : "600px"}
      bg={bgColor}
      borderRadius="0"
      boxShadow="0 8px 40px rgba(0,0,0,0.12)"
      zIndex={9999}
      display="flex"
      flexDirection="row"
      border="1px solid"
      borderColor={borderColor}
      overflow="hidden"
      fontFamily="'Inter', sans-serif"
    >
      {/* SIDEBAR FILTRES - Côté gauche (toujours visible) */}
      <Box
        width={isMobile ? "110px" : "140px"}
        bg={cardBg}
        borderRight="1px solid"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
        overflowY="auto"
        p={isMobile ? 2 : 3}
        gap={isMobile ? 2 : 4}
      >
        <FilterPanel 
          mobile={isMobile}
          budgetFilter={budgetFilter}
          setBudgetFilter={handleSetBudgetFilter}
          inStockOnly={inStockOnly}
          setInStockOnly={handleSetInStockOnly}
          clearChat={handleClearChat}
          colors={filterPanelColors}
        />
      </Box>

      {/* ZONE CHAT - Côté droit */}
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          bg={bgColor}
          p={3}
          borderBottom="1px solid"
          borderColor={borderColor}
          justify="space-between"
          align="center"
          height="56px"
          width="100%"
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

        {/* Messages - Area */}
        <Box 
          flex="1" 
          p={3} 
          overflowY="auto" 
          bg={bgColor}
          width="100%"
        >
          <VStack spacing={4} align="stretch">
            {messages.map((msg, i) => (
              <Box
                key={i}
                alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
                maxWidth="90%"
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
                      {/* Applied filters summary */}
                      {/* Filters summary moved to persistent bar above the input (see below) */}
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
            <Box alignSelf="flex-start" maxWidth="90%">
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

      {/* Input Area - Bottom */}
      <Box
        p={3}
        borderTop="1px solid"
        borderColor={borderColor}
        bg={bgColor}
        width="100%"
      >
        <VStack spacing={2}>
          <HStack spacing={2} width="100%">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && sendMessage()}
              autoFocus
              placeholder="Votre message..."
              size="sm"
              isDisabled={isLoading}
              fontSize="13px"
              border="1px solid"
              borderColor={inputBorder}
              borderRadius="2px"
              height="36px"
              bg={inputBg}
              color={textColor}
              _focus={{
                borderColor: '#10b981',
                boxShadow: 'none'
              }}
              _placeholder={{
                color: mutedTextColor,
                fontSize: '13px'
              }}
            />
            <Button
              onClick={sendMessage}
              bg={buttonBg}
              color="white"
              size="sm"
              isLoading={isLoading}
              loadingText=""
              height="36px"
              minWidth="70px"
              borderRadius="2px"
              fontSize="12px"
              fontWeight="500"
              _hover={{
                bg: buttonHover
              }}
            >
              Envoyer
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
    </Box>
  );
};