import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const fonts = {
  heading: `"Times New Roman", Times, serif`,
  body: `"Times New Roman", Times, serif`,
}

// Palette conservée
const colors = {
  brand: {
    50: '#F4DBD8',
    100: '#BEA8A7',
    200: '#C09891',
    300: '#775144',
    400: '#4A2B24',
    500: '#2A0800',
    600: '#260700',
    700: '#1e0500',
    800: '#170400',
    900: '#000000ff',
  },
  accent: {
    50: '#fff5f4',
    100: '#feecec',
    200: '#fbdada',
    300: '#f9c7c6',
    400: '#f7b5b4',
    500: '#f4a29f',
    600: '#d08583',
    700: '#a86a68',
    800: '#7f504f',
    900: '#553735',
  }
}

const components = {
  Button: {
    baseStyle: {
      borderRadius: '16px', // arrondi légèrement plus moderne
      fontWeight: 600,
      boxShadow: '0 2px 6px rgba(0,0,0,0.12)', // shadow douce
      _focus: { boxShadow: '0 0 0 3px rgba(199, 128, 115, 0.4)' },
      transition: 'all 0.2s ease-in-out', // hover smooth
    },
    variants: {
      solid: {
        bg: 'brand.300',
        color: 'white',
        bgGradient: 'linear(to-br, brand.300, brand.400)',
        _hover: { 
          bgGradient: 'linear(to-br, brand.200, brand.300)', 
          transform: 'translateY(-2px)' 
        },
        _active: { transform: 'translateY(0)' },
      },
      subtle: {
        bg: 'brand.50',
        color: 'brand.700',
        _hover: { 
          bg: 'brand.100', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
        },
      },
      outline: {
        borderRadius: '16px',
        borderColor: 'brand.200',
        _hover: { bg: 'brand.50' },
      },
    },
    sizes: {
      md: { h: 10, fontSize: 'md', px: 6 },
      lg: { h: 14, fontSize: 'lg', px: 8 },
    },
  },
  Heading: {
    baseStyle: { fontFamily: fonts.heading },
  },
}

const styles = {
  global: {
    'html, body': {
      fontSize: { base: '17px', md: '15px' },
      bg: 'linear-gradient(135deg, #712d2dff, #7d3c20ff)', // dégradé moderne
      color: 'white',
      minHeight: '100vh',
      scrollBehavior: 'smooth',
    },
    'input, textarea, select': { 
      background: 'white', 
      color: 'black', 
      borderRadius: '12px', 
      border: '1px solid #ccc',
      _focus: { borderColor: 'brand.300', boxShadow: '0 0 0 3px rgba(199, 128, 115, 0.3)' }
    },
    'a': { textDecoration: 'none', transition: 'color 0.2s' },
    'button': { WebkitTapHighlightColor: 'transparent' },
  },
}

const theme = extendTheme({ config, fonts, colors, components, styles })

export default theme
