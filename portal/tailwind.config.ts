import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'button-primary':
          '0px 1px 2px 0px rgba(10, 10, 10, 0.04), 0px 0px 6px 0px rgba(255, 246, 237, 0.24) inset',
        'button-primary-focused':
          '0px 0px 0px 2px #FFF, 0px 0px 0px 4px var(--Color-Orange-500, #FF6C15), 0px 1px 2px 0px rgba(10, 10, 10, 0.04), 0px 0px 6px 0px rgba(255, 246, 237, 0.24) inset',
        'button-secondary': '0px 1px 2px 0px rgba(10, 10, 10, 0.04)',
        'button-secondary-focused':
          '0px 0px 0px 2px #FFF, 0px 0px 0px 4px var(--Color-Orange-500, #FF6C15), 0px 1px 2px 0px rgba(10, 10, 10, 0.04)',
        'help-icon':
          '0px 1px 2px 0px rgba(10 10 10 0.04), 0px 1px 4px 0px #rgba(10 10 10 0.02)',
        'help-menu':
          '0px 4px 12px 0px rgba(10 10 10 0.06), 0px 4px 6px 0px rgba(10 10 10 0.02), 0px 0px 0px 1px rgba(10 10 10 0.06)',
        'hemi-layout':
          '0px 2px 2px 0px rgba(10, 10, 10, 0.04), 0px 8px 16px -4px rgba(10, 10, 10, 0.04)',
        'large':
          '0px 2px 4px 0px rgba(0, 2, 2, 0.04), 0px 8px 24px -4px rgba(0, 2, 2, 0.04)',
        'soft': '0px 1px 2px 0px rgba(10, 10, 10, 0.04)',
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
        points: {
          'bsquared': '#FFB852',
          'eigenpie': '#131247',
          'pump-btc': '#69DFFA',
          'solv': '#EDE5FB',
          'unirouter': '#9600FF',
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
        'inter-display': ['var(--font-inter-display)'],
        'inter-variable': ['var(--font-inter-variable)'],
      },
      fontSize: {
        // Prefer ordering by font size instead of keys
        /* eslint-disable sort-keys */
        'xxs': [
          '0.688rem', // 11px,
          {
            letterSpacing: '-0.22px',
            lineHeight: '11px',
          },
        ],
        'xs': [
          '0.75rem', // 12px,
          {
            letterSpacing: '-0.24px',
            lineHeight: '16px',
          },
        ],
        'sm': [
          '0.8125rem', // 13px
          {
            letterSpacing: '-0.28px',
            lineHeight: '20px',
          },
        ],
        'base': [
          '1rem', // 16px
          {
            letterSpacing: '-0.32px',
            lineHeight: '24px',
          },
        ],
        'lg': [
          '1.125rem', // 18px
          {
            letterSpacing: '-0.36px',
            lineHeight: '24px',
          },
        ],
        'xl': [
          '1.25rem', // 20px
          {
            letterSpacing: '-0.4px',
            lineHeight: '26px',
          },
        ],
        '2xl': [
          '1.5rem', // 24px
          {
            letterSpacing: '-0.48px',
            lineHeight: '32px',
          },
        ],
        '3xl': [
          '1.875rem', // 30px
          {
            letterSpacing: '-0.6px',
            lineHeight: '40px',
          },
        ],
        '3.25xl': [
          '2rem', // 32px
          {
            letterSpacing: '-0.64px',
            lineHeight: '40px',
          },
        ],
        '4xl': [
          '2.25rem', // 40px
          {
            letterSpacing: '-0.72px',
            lineHeight: '44px',
          },
        ],
        '5xl': [
          '3rem', // 48px
          {
            letterSpacing: '-0.96px',
            lineHeight: '56px',
          },
        ],
        '6xl': [
          '3.75rem', // 60px
          {
            letterSpacing: '-1.2px',
            lineHeight: '60px',
          },
        ],
        '7xl': [
          '4.5rem', // 72px
          {
            letterSpacing: '-1.44px',
            lineHeight: '72px',
          },
        ],
        '8xl': [
          '6rem', // 96px
          {
            letterSpacing: '-1.92px',
            lineHeight: '96px',
          },
        ],
        '9xl': [
          '8rem', // 128px
          {
            letterSpacing: '-2.56px',
            lineHeight: '128px',
          },
        ],
        /* eslint-enable sort-keys */
      },
      height: {
        '97vh': '97vh',
        '98vh': '98vh',
        // 96px from header (height + padding), 40px from container's padding top in > md screens
        'fit-rest-screen': 'calc(100dvh - 96px) md:calc(100dvh - 96px - 40px)',
        // 67px from header, 24px from container margin's top, and 28px twice from body y-padding
        'fit-rest-screen-desktop': 'calc(100vh - 67px - 24px - 28px - 28px)',
        // same as above, but header is now 32px
        'fit-rest-screen-mobile': 'calc(100vh - 32px - 24px - 28px - 28px)',
      },
      inset: {
        '2.25': '0.563rem',
        // sort-keys flags this as an error, incorrectly. However, I cannot reproduce it in the Eslint playground,
        // so it must be something that was fixed in newer versions
        // eslint-disable-next-line sort-keys
        '2.5': '0.625rem',
      },
      lineHeight: {
        '6.5': '1.625rem',
      },
      opacity: {
        '88': '.88',
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
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '3.5': '0.875rem',
        '4.5': '1.125rem',
        '11.5': '2.875rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '21': '5.25rem',
        '22': '5.5rem',
        '23': '5.75rem',
        '26': '6.5rem',
        '29': '7.25rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '42': '10.5rem',
        '90': '22.5rem',
      },
    },
  },
}
export default config
