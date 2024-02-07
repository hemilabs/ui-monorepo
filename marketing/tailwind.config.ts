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
        'triangles-pattern': "url('../public/main-background.webp')",
      },
      fontFamily: {
        'bricolage-grotesque': '--font-bricolage-grotesque',
        'inter': '--font-inter',
      },
    },
  },
}

export default config
