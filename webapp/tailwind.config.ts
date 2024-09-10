import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../node_modules/ui-common/components/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
  theme: {
    extend: {
      animation: {
        'withdraw-progress': 'withdraw-progress 2s infinite',
      },
      backdropBlur: {
        '20': '20px',
      },
      backgroundImage: {
        'hemi-gradient':
          'linear-gradient(143deg, #F16063 -3.27%, rgba(116, 96, 241, 0.00) 130.65%)',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'hemi-layout':
          '0px 2px 2px 0px rgba(10, 10, 10, 0.04), 0px 8px 16px -4px rgba(10, 10, 10, 0.04)',
      },
      // See https://www.figma.com/design/4fVd9wneclsvYDYD95ApZ9/Hemi-Portal?node-id=3685-11596&node-type=FRAME&m=dev
      colors: {
        orange: {
          50: '#FFF6ED',
          100: '#FFEBD4',
          200: '#FFD4A8',
          300: '#FFB570',
          400: '#FF8937',
          500: '#FF6C15',
          600: '#F04D06',
          700: '#C73807',
          800: '#9e2d0E',
          900: '#7F280F',
          950: '#451105',
          hemi: '#FF5F00',
        },
        slate: {
          50: '#F7F7F7',
          100: '#E5E6E6',
          200: '#CCCCCC',
          300: '#B2B3B3',
          400: '#999A9A',
          500: '#808080',
          600: '#666767',
          700: '#4D4E4E',
          800: '#333535',
          900: '#1A1B1B',
          950: '#000202',
        },
      },
      fontFamily: {
        inter: '--font-inter',
      },
      fontSize: {
        '3.25xl': '2rem',
        'ms': '0.8125rem',
      },
      height: {
        '17': '4.25rem',
        '97vh': '97vh',
        '98vh': '98vh',
        // 96px from header (height + padding), 40px from container's padding top in > md screns
        'fit-rest-screen': 'calc(100dvh - 96px) md:calc(100dvh - 96px - 40px)',
        // 67px from header, 24px from container margin's top, and 28px twice from body y-padding
        'fit-rest-screen-desktop': 'calc(100vh - 67px - 24px - 28px - 28px)',
        // same as above, but header is now 32px
        'fit-rest-screen-mobile': 'calc(100vh - 32px - 24px - 28px - 28px)',
      },
      // Tailwind order-x classes go up to 12 - https://tailwindcss.com/docs/order
      order: {
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17',
        '18': '18',
      },
      padding: {
        '1.5': '0.375rem',
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
    },
  },
}
export default config
