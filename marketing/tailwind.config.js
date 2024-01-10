/* eslint-env node */
'use strict'
module.exports = {
  content: ['./index.html'],
  plugins: [],
  theme: {
    extend: {
      backgroundImage: {
        'triangles-pattern': "url('main-background.webp')",
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'right-grotesk': ['PP Right Grotesk', 'sans-serif'],
      },
    },
  },
}
