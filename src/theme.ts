import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const fonts = {
  heading: `"Times New Roman", Times, serif`,
  body: `"Times New Roman", Times, serif`,
}

// Palette inspired by your attachment (warm brown & rose tones)
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
      borderRadius: '14px',
      fontWeight: 600,
      boxShadow: 'sm',
      _focus: { boxShadow: 'outline' },
    },
    variants: {
      solid: {
        bg: 'brand.300',
        color: 'white',
        _hover: { bg: 'brand.200', transform: 'translateY(-1px)' },
        _active: { transform: 'translateY(0)' },
      },
      subtle: {
        bg: 'brand.50',
        color: 'brand.700',
        _hover: { bg: 'brand.100' },
      },
      outline: {
        borderRadius: '14px',
        borderColor: 'brand.200',
      },
    },
    sizes: {
      md: {
        h: 10,
        fontSize: 'md',
        px: 5,
      },
      lg: {
        h: 14,
        fontSize: 'lg',
        px: 6,
      },
    },
  },
  Heading: {
    baseStyle: { fontFamily: fonts.heading },
  },
}

// responsive font sizes: slightly bigger on mobile for readability
const styles = {
  global: {
    'html, body': {
      fontSize: { base: '17px', md: '15px' },
      // Use a single uniform background so the page looks consistent when scrolling
      bg: '#775144',
      color: 'brand.900',
      minHeight: '100vh',
    },
    'a': { textDecoration: 'none' },
    'button': { WebkitTapHighlightColor: 'transparent' },
  },
}

const theme = extendTheme({ config, fonts, colors, components, styles })

export default theme
