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
      backgroundImage: {
        'hemi-gradient':
          'linear-gradient(143deg, #F16063 -3.27%, rgba(116, 96, 241, 0.00) 130.65%)',
        'triangles-pattern': "url('../public/main-background.webp')",
      },
      // See https://www.figma.com/file/4fVd9wneclsvYDYD95ApZ9/Hemi-Portal?node-id=8%3A5122&mode=dev
      colors: {
        // Easier to read sorted like this, instead of sorting asc (as string) as the rules indicates
        /* eslint-disable sort-keys */
        orange: {
          1: '#FF4D00',
          50: '#FFFBF8',
          200: '#FFE2D0',
          300: '#FFD3B9',
          400: '#FFC4A1',
          500: '#FFB58A',
          600: '#FFA773',
          700: '#FF985B',
          800: '#FF7D33',
          900: '#FF7B2C',
          950: '#FF6C15',
          hemi: '#FF5F00',
        },
        slate: {
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
        /* eslint-disable sort-keys */
      },
      fontFamily: {
        inter: '--font-inter',
      },
      height: {
        // 96px from header (height + padding), 40px from container's padding top in > md screens
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
    },
  },
}
export default config
