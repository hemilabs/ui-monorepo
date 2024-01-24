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
      backgroundImage: {
        'bvm-gradient':
          'linear-gradient(143deg, #F16063 -3.27%, rgba(116, 96, 241, 0.00) 130.65%)',
      },
      fontFamily: {
        'inter': '--font-inter',
        'bricolage-grotesque': '--font-bricolage-grotesque',
      },
    },
  },
}
export default config
