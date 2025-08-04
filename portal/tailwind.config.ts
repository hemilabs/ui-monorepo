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
        'button-primary': 'linear-gradient(180deg, #FF8E4D 0%, #FF6C15 100%)',
        'button-primary-disabled':
          'linear-gradient(180deg, #FF8E4D 0%, #FF6C15 100%)',
        'button-primary-hovered':
          'linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), linear-gradient(180deg, #FF8E4D 0%, #FF6C15 100%)',
        'earnpoints-hover':
          'linear-gradient(0deg, rgba(255,108,21,0.12) 43.65%, rgba(255,24,20,0.12) 106.25%)',
        'hemi-gradient':
          'linear-gradient(143deg, #F16063 -3.27%, rgba(116, 96, 241, 0.00) 130.65%)',
        'recommended-claim':
          'linear-gradient(0deg, rgba(0, 156, 245, 0.03) 0%, rgba(0, 156, 245, 0.03) 100%), linear-gradient(0deg, rgba(250, 250, 250, 0.64) 0%, rgba(250, 250, 250, 0.64) 100%)',
      },
      blur: {
        '1.5xl': '32px',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      borderWidth: {
        '1.5': '1.5px',
        '3': '3px',
      },
      boxShadow: {
        'button-primary':
          '0 1px 3px 0 rgba(10, 10, 10, 0.15), 0 7px 11px -5px rgba(10, 10, 10, 0.11), 0 2px 1px 0 rgba(255, 255, 255, 0.14) inset',
        'button-primary-disabled':
          '0 1px 3px 0 rgba(10,10,10,0.15), 0 7px 11px -5px rgba(10,10,10,0.11), inset 0 2px 1px 0 rgba(255,255,255,0.14)',
        'button-primary-focused':
          '0 0 0 1px #FFF, 0 0 0 4px #FFEBD4, 0 1px 3px 0 rgba(10, 10, 10, 0.15), 0 7px 11px -5px rgba(10, 10, 10, 0.11), inset 0 2px 1px 0 rgba(255, 255, 255, 0.14)',
        'button-secondary':
          '0 0 0 1px rgba(10, 10, 10, 0.08), 0 1px 3px 0 rgba(10, 10, 10, 0.15), 0 7px 11px -5px rgba(10, 10, 10, 0.11)',
        'button-secondary-disabled':
          '0 1px 3px 0 rgba(10, 10, 10, 0.15), 0 7px 11px -5px rgba(10, 10, 10, 0.11)',
        'button-secondary-focused':
          '0 0 0 1px rgba(10, 10, 10, 0.08), 0 0 0 4px #E5E5E5, 0 1px 3px 0 rgba(10, 10, 10, 0.15), 0 7px 11px -5px rgba(10, 10, 10, 0.11)',
        'button-tertiary-focused': '0 0 0 4px #E5E5E5',
        'claim-page-high':
          '0 0 0 1px rgba(10, 10, 10, 0.08), 0 3px 12px 0 rgba(0, 0, 0, 0.04), 0 7px 16px -5px rgba(10, 10, 10, 0.08)',
        'claim-page-soft': '0 0 0 1px rgba(10, 10, 10, 0.08)',
        'help-icon':
          '0px 1px 2px 0px rgba(10 10 10 0.04), 0px 1px 4px 0px #rgba(10 10 10 0.02)',
        'help-menu':
          '0px 4px 12px 0px rgba(10 10 10 0.06), 0px 4px 6px 0px rgba(10 10 10 0.02), 0px 0px 0px 1px rgba(10 10 10 0.06)',
        'hemi-layout':
          '0px 2px 2px 0px rgba(10, 10, 10, 0.04), 0px 8px 16px -4px rgba(10, 10, 10, 0.04)',
        'large':
          '0px 2px 4px 0px rgba(0, 2, 2, 0.04), 0px 8px 24px -4px rgba(0, 2, 2, 0.04)',
        'navbar':
          '0px 0px 0px 1px rgba(212, 212, 216, 0.56), 12px 0px 24px -8px rgba(10, 10, 10, 0.06), 0px 10px 24px -8px rgba(10, 10, 10, 0.08), 0px 4px 6px -2px rgba(10, 10, 10, 0.04)',
        'soft': '0px 1px 2px 0px rgba(10, 10, 10, 0.04)',
        'token-selector':
          '0px 0px 0px 1px rgba(10,10,10,0.08), 0px 1px 3px 0px rgba(10,10,10,0.08), 0px 1px 2px -1px rgba(10,10,10,0.08)',
        'top-token-selector': 'inset 0 4px 4px -2px rgba(0,0,0,0.03)',
      },
      // See https://www.figma.com/design/4fVd9wneclsvYDYD95ApZ9/Hemi-Portal?node-id=3685-11596&node-type=FRAME&m=dev
      colors: {
        'button': {
          'primary-custom': '#DB6825',
        },
        'orange': {
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
        'points': {
          'bsquared': '#FFB852',
          'eigenpie': '#131247',
          'pump-btc': '#69DFFA',
          'solv': '#EDE5FB',
          'unirouter': '#9600FF',
        },
        'sky': {
          450: '#009CF5',
          550: '#0EA5E9',
          850: '#004E7B',
          950: '#738ABC',
        },
        'token-selector-hover': {
          eth: 'rgba(98, 126, 234, 0.08)',
          usdc: 'rgba(39, 117, 202, 0.08)',
          usdt: 'rgba(39, 161, 124, 0.08)',
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
            letterSpacing: '0.2px',
            lineHeight: '16px',
          },
        ],
        'xs': [
          '0.75rem', // 12px,
          {
            letterSpacing: '0.1px',
            lineHeight: '17px',
          },
        ],
        'sm': [
          '0.8125rem', // 13px
          {
            letterSpacing: '0',
            lineHeight: '18px',
          },
        ],
        'smd': [
          '0.875rem', // 14px
          {
            letterSpacing: '-0.06px',
            lineHeight: '20px',
          },
        ],
        'mid': [
          '0.938rem', // 15px
          {
            letterSpacing: '-0.12px',
            lineHeight: '22px',
          },
        ],
        'base': [
          '1rem', // 16px
          {
            letterSpacing: '-0.2px',
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
        '2.33xl': [
          '1.75rem', // 28px
          {
            letterSpacing: '-0.28px',
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
          '2.25rem', // 36px
          {
            letterSpacing: '-0.72px',
            lineHeight: '40px',
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
        '6.4xl': [
          '4rem', // 64px
          {
            letterSpacing: '-1.28px',
            lineHeight: '68px',
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
      screens: {
        xs: '425px',
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
        '86': '21.5rem',
        '90': '22.5rem',
        '94': '23.5rem',
        '120': '30rem',
      },
    },
  },
}
export default config
