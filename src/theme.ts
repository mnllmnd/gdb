import { extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

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

  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: (props: any) => mode('white', 'gray.800')(props),
          color: (props: any) => mode('black', 'white')(props),
          _hover: {
            bg: (props: any) => mode('brand.100', 'gray.700')(props),
            _disabled: { bg: (props: any) => mode('white', 'gray.800')(props) },
          },
        },
        outline: {
          borderColor: (props: any) => mode('brand.300', 'gray.600')(props),
          color: (props: any) => mode('black', 'white')(props),
          _hover: { bg: (props: any) => mode('brand.50', 'gray.700')(props) },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          overflow: 'hidden',
          bg: (props: any) => mode('white', 'gray.800')(props),
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
      body: (props: any) => ({
        position: 'relative',
        zIndex: 0,
        minHeight: '100vh',
        width: '100%',
        color: mode('#0f172a', '#E6EEF8')(props),
        _before: {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bg: mode('brand.50', 'gray.900')(props), // overlay selon mode
          zIndex: -1,
        },
      }),
      '.chakra-button': { color: (props: any) => mode('black', 'white')(props) },
      '.chakra-menu__menuitem, .chakra-menu__menuitem:hover, .chakra-menu__menuitem:focus': {
        color: (props: any) => mode('black', 'white')(props),
      },
      header: (props: any) => ({
        position: 'relative',
        zIndex: 10,
        bg: mode('white', 'gray.900')(props),
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid',
        borderColor: mode('brand.200', 'gray.800')(props),
      }),
      '#root': { position: 'relative', zIndex: 1, minHeight: '100vh' },
      'h1, h2, h3, h4, h5, h6': { color: (props: any) => mode('black', 'white')(props) },
      p: { color: (props: any) => mode('black', 'white')(props) },
    },
  },
})

export default theme
