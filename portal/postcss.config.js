import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import tailwindcss from 'tailwindcss'

// Order matters and is the point of the array form: postcss-import has to
// inline the @imported stylesheets before the others process them. Alphabetical
// sorting, which the repo applies to object keys, would put autoprefixer first
// and leave the imported files unprefixed.
export default {
  plugins: [postcssImport(), tailwindcss(), autoprefixer()],
}
