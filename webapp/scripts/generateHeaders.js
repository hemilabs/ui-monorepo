/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const { writeFile } = require('fs/promises')
const path = require('path')

const getDomain = function (url) {
  if (!url) {
    return null
  }
  try {
    return new URL(url).hostname
  } catch (error) {
    // invalid url
    return null
  }
}

let htaccess = `<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

  Header always set X-Frame-Options "SAMEORIGIN"
  
  Header always set X-Content-Type-Options "nosniff"
  
  Header always set X-XSS-Protection "1; mode=block"
  
  Header always set X-Download-Options "noopen"

  Header always set Expect-CT "max-age=86400, enforce"

  Header always set Referrer-Policy "no-referrer-when-downgrade"

  Header always set Permissions-Policy: geolocation=(), microphone=()
</IfModule>
`

const domain = getDomain(process.env.NEXT_PUBLIC_ANALYTICS_URL)

if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && domain !== null) {
  htaccess += `
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "https://${domain}"
    Header always set Access-Control-Allow-Methods "POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type"
    Header always set Content-Security-Policy "script-src 'self' "${domain}"
</IfModule>`
}

// eslint-disable-next-line promise/catch-or-return
writeFile(path.resolve(__dirname, '../out/.htaccess'), htaccess).then(() =>
  // eslint-disable-next-line no-console
  console.info('Headers generated successfully'),
)
