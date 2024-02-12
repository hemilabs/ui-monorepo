/* eslint-env node */
'use strict'

module.exports = {
  content: ['./index.html'],
  plugins: [],
  theme: {
    extend: {
      colors: {
        orange: {
          650: '#FF5F00',
        },
      },
      fontFamily: {
        'bricolage-grotesque': ['Bricolage Grotesque', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
}
