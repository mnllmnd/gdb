import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
    body: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
  },
  colors: {
    brand: {
      50: '#ffffff',
      100: '#f9f9f9',
      200: '#f0f0f0',
      300: '#e6e6e6',
      400: '#dcdcdc',
      500: '#cfcfcf',
      600: '#bdbdbd',
      700: '#9e9e9e',
      800: '#7e7e7e',
      900: '#5f5f5f',
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
          bg: 'white',
          color: 'black',
          _hover: {
            bg: 'brand.100',
            _disabled: { bg: 'white' },
          },
        },
        outline: {
          borderColor: 'brand.300',
          color: 'black',
          _hover: { bg: 'brand.50' },
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
        position: 'relative',
        zIndex: 0,
        minHeight: '100vh',
        width: '100%',
        _before: {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bg: 'brand.50', // overlay blanc subtil
          zIndex: -1,
        },
      },
      '.chakra-button': { color: 'black' },
      '.chakra-menu__menuitem, .chakra-menu__menuitem:hover, .chakra-menu__menuitem:focus': {
        color: 'black',
      },
      header: {
        position: 'relative',
        zIndex: 10,
        bg: 'white',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid',
        borderColor: 'brand.200',
      },
      '#root': { position: 'relative', zIndex: 1, minHeight: '100vh' },
      'h1, h2, h3, h4, h5, h6': { color: 'black' },
      p: { color: 'black' },
    },
  },
})

export default theme
