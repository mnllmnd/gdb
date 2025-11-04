import { extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const theme = extendTheme({
  fonts: {
    heading: `'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    body: `'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  },
  
  colors: {
    // Palette Zara-inspired - tons neutres et élégants
    brand: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    // Accent colors pour les éléments interactifs
    accent: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },

  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  // Styles globaux repensés pour Zara
  styles: {
    global: (props: any) => ({
      'html, body': {
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        fontFamily: "'Inter', sans-serif",
        backgroundColor: mode('#ffffff', '#000000')(props),
        color: mode('#171717', '#ffffff')(props),
        transition: 'background-color 0.3s ease, color 0.3s ease',
      },
      
      body: {
        position: 'relative',
        zIndex: 0,
        minHeight: '100vh',
        width: '100%',
        lineHeight: '1.6',
      },
      
      // Header avec style Zara
      header: {
        position: 'relative',
        zIndex: 10,
        bg: mode('white', 'black')(props),
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid',
        borderColor: mode('#e5e5e5', '#262626')(props),
        transition: 'all 0.3s ease',
      },
      
      // Typographie élégante
      'h1, h2, h3, h4, h5, h6': {
        color: mode('#171717', '#ffffff')(props),
        fontWeight: '600',
        letterSpacing: '-0.025em',
        lineHeight: '1.2',
      },
      
      'h1': {
        fontSize: '2.25rem',
        fontWeight: '700',
      },
      
      'h2': {
        fontSize: '1.875rem',
      },
      
      'p, span, div': {
        color: mode('#404040', '#e5e5e5')(props),
      },
      
      // Liens
      'a': {
        color: mode('#171717', '#ffffff')(props),
        textDecoration: 'none',
        transition: 'color 0.2s ease',
        _hover: {
          color: mode('#404040', '#a3a3a3')(props),
        },
      },
      
      // Scrollbar personnalisée
      '::-webkit-scrollbar': {
        width: '6px',
      },
      
      '::-webkit-scrollbar-track': {
        background: mode('#f5f5f5', '#171717')(props),
      },
      
      '::-webkit-scrollbar-thumb': {
        background: mode('#d4d4d4', '#404040')(props),
        borderRadius: '3px',
      },
      
      '::-webkit-scrollbar-thumb:hover': {
        background: mode('#a3a3a3', '#525252')(props),
      },
    }),
  },

  // Composants repensés style Zara
  components: {
    // Boutons élégants et sobres
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'none', // Zara utilise des angles droits
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.3s ease',
        _focus: {
          boxShadow: 'none',
        },
      },
      variants: {
        // Style principal Zara - noir et blanc
        solid: (props: any) => ({
          bg: mode('black', 'white')(props),
          color: mode('white', 'black')(props),
          border: '1px solid',
          borderColor: mode('black', 'white')(props),
          _hover: {
            bg: mode('white', 'black')(props),
            color: mode('black', 'white')(props),
            transform: 'translateY(-1px)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        
        // Style secondaire - contours fins
        outline: (props: any) => ({
          border: '1px solid',
          borderColor: mode('#d4d4d4', '#404040')(props),
          color: mode('#171717', '#ffffff')(props),
          bg: 'transparent',
          _hover: {
            bg: mode('#fafafa', '#171717')(props),
            borderColor: mode('#a3a3a3', '#737373')(props),
            transform: 'translateY(-1px)',
          },
        }),
        
        // Style ghost minimaliste
        ghost: (props: any) => ({
          color: mode('#171717', '#ffffff')(props),
          bg: 'transparent',
          _hover: {
            bg: mode('#f5f5f5', '#262626')(props),
          },
        }),
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    
    // Cartes avec design épuré Zara
    Card: {
      baseStyle: (props: any) => ({
        container: {
          borderRadius: 'none', // Angles droits comme Zara
          overflow: 'hidden',
          bg: mode('white', 'black')(props),
          border: '1px solid',
          borderColor: mode('#e5e5e5', '#262626')(props),
          transition: 'all 0.3s ease',
          _hover: {
            transform: 'translateY(-4px)',
            borderColor: mode('#a3a3a3', '#404040')(props),
          },
        },
      }),
    },
    
    // Inputs élégants
    Input: {
      baseStyle: (props: any) => ({
        field: {
          borderRadius: 'none',
          border: '1px solid',
          borderColor: mode('#d4d4d4', '#404040')(props),
          bg: mode('white', 'black')(props),
          color: mode('#171717', '#ffffff')(props),
          _hover: {
            borderColor: mode('#a3a3a3', '#737373')(props),
          },
          _focus: {
            borderColor: mode('#171717', '#ffffff')(props),
            boxShadow: 'none',
          },
          _placeholder: {
            color: mode('#a3a3a3', '#737373')(props),
          },
        },
      }),
    },
    
    // Modal style Zara
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          borderRadius: 'none',
          bg: mode('white', 'black')(props),
          border: '1px solid',
          borderColor: mode('#e5e5e5', '#262626')(props),
        },
        header: {
          color: mode('#171717', '#ffffff')(props),
          borderBottom: '1px solid',
          borderColor: mode('#e5e5e5', '#262626')(props),
        },
        body: {
          color: mode('#404040', '#e5e5e5')(props),
        },
      }),
    },
    
    // Drawer style Zara
    Drawer: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: mode('white', 'black')(props),
          border: '1px solid',
          borderColor: mode('#e5e5e5', '#262626')(props),
        },
      }),
    },
    
    // Menu déroulant
    Menu: {
      baseStyle: (props: any) => ({
        list: {
          borderRadius: 'none',
          bg: mode('white', 'black')(props),
          border: '1px solid',
          borderColor: mode('#e5e5e5', '#262626')(props),
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        item: {
          bg: mode('white', 'black')(props),
          color: mode('#171717', '#ffffff')(props),
          _hover: {
            bg: mode('#f5f5f5', '#262626')(props),
          },
          _focus: {
            bg: mode('#f5f5f5', '#262626')(props),
          },
        },
      }),
    },
    
    // Tabs élégants
    Tabs: {
      variants: {
        // Style ligne épuré
        line: (props: any) => ({
          tab: {
            color: mode('#737373', '#a3a3a3')(props),
            borderBottom: '2px solid transparent',
            _selected: {
              color: mode('#171717', '#ffffff')(props),
              borderBottomColor: mode('#171717', '#ffffff')(props),
            },
            _hover: {
              color: mode('#171717', '#ffffff')(props),
            },
          },
        }),
      },
    },
  },
})

export default theme