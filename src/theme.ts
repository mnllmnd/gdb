import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: `'Times New Roman', serif`,
    body: `'Times New Roman', serif`,
  },
  colors: {
    brand: {
      50: '#cbc5eac1',
      100: '#BAE3FF',
      200: '#7CC4FA',
      300: '#47A3F3',
      400: '#2186EB',
      500: '#0967D2',
      600: '#0552B5',
      700: '#03449E',
      800: '#01337D',
      900: '#002159',
      980: '#0e0033ff',
    },
    accent: {
      50: '#b292d3ff',
      100: '#c2b9e6ff',
      200: '#CBD2D9',
      300: '#9AA5B1',
      400: '#7B8794',
      500: '#616E7C',
      600: '#52606D',
      700: '#3E4C59',
      800: '#323F4B',
      900: '#1F2933',
    },
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: 'brand.980',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: {
              bg: 'brand.500',
            },
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          overflow: 'hidden',
          bg: 'white',
          transition: 'all 0.3s ease',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow: 'lg',
          },
        },
      },
    },
  },

  styles: {
    global: {
      'html, body': {
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      },
      body: {
        // ✅ Image de fond qui s'affiche correctement
        
        backgroundRepeat: 'repeat',
       
        position: 'relative',
        zIndex: 0,
        minHeight: '100vh',
        width: '100%',

        // ✅ Overlay pour lisibilité
        _before: {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bg: 'rgba(68, 63, 197, 0.16)', // Ajustez l'opacité selon vos besoins
          zIndex: -1,
        },
      },

      // ✅ Header avec fond solide
      header: {
        position: 'relative',
        zIndex: 10,
        bg: 'white',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
      },

      '#root': {
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
      },
    },
  },
})

export default theme