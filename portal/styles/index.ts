// this color needs to be used in some places as styles
// and can't be read from tailwind config. So at least I'm using a constant
// to avoid duplicating it everywhere
export const orange600 = '#FF4600'

// This should match tailwind's breakpoint config
// in https://v3.tailwindcss.com/docs/responsive-design
// or the custom theme in tailwind.config.ts
export const screenBreakpoints = {
  /* eslint-disable sort-keys */
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
  /* eslint-enable sort-keys */
} as const
