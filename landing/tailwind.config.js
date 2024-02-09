/* eslint-env node */

module.exports = {
  content: ['./index.html'],
  plugins: [],
  theme: {
    extend: {
      colors: {
        orange: {
          650: '#D14600',
        },
      },
      fontFamily: {
        'bricolage-grotesque': ['Bricolage Grotesque', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
}
