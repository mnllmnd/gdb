import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    // Neutral, geometric sans for a clean, Nike-like appearance
    heading: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
    body: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
  },
  colors: {
    // Neutral palette (grayscale + black/white) for a minimalist, cinematic look
    brand: {
      50: '#f7f7f77',
      100: '#efefef',
      200: '#e0e0e0',
      300: '#cfcfcf',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#7e7e7e',
      700: '#5f5f5f',
      800: '#3f3f3f',
      900: '#1f1f1f',
    },
    accent: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eaeaea',
      300: '#dcdcdc',
      400: '#cfcfcf',
      500: '#bdbdbd',
      600: '#9e9e9e',
      700: '#7e7e7e',
      800: '#616161',
      900: '#424242',
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
          // Neutral solid buttons — white background with dark text for cinematic CTAs
          bg: 'white',
          color: 'black',
          _hover: {
            bg: 'brand.100',
            _disabled: {
              bg: 'white',
            },
          },
        },
        outline: {
         
         
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
          bg: '#cec0b3ff', // Ajustez l'opacité selon vos besoins
          zIndex: -1,
        },
      },
      /* Ensure buttons and menu items are readable on light backgrounds.
         This is a safe, small override so ghost/outline variants don't appear
         white-on-white when a global background or overlay is present. */
      '.chakra-button': {
        color: 'gray.800',
      },
      '.chakra-menu__menuitem, .chakra-menu__menuitem:hover, .chakra-menu__menuitem:focus': {
        color: 'gray.800',
      },

      // ✅ Header avec fond solide
      header: {
        position: 'relative',
        zIndex: 10,
        bg: '#D1B7A1',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
      },

      '#root': {
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
      },
      // Make all headings white by default
      'h1, h2, h3, h4, h5, h6': {
        color: 'white',
      },
    },
  },
})

export default theme