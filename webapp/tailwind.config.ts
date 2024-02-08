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
      backgroundImage: {
        'bvm-gradient':
          'linear-gradient(143deg, #F16063 -3.27%, rgba(116, 96, 241, 0.00) 130.65%)',
      },
      fontFamily: {
        'bricolage-grotesque': '--font-bricolage-grotesque',
        'inter': '--font-inter',
      },
    },
  },
}
export default config
