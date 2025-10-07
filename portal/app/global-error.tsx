'use client'

import 'styles/globals.css'

import { Error500 } from 'components/error500'
import hemiSocials from 'hemi-socials'
import { type ComponentProps } from 'react'

const { discordUrl } = hemiSocials

const GlobalError = (props: Pick<ComponentProps<typeof Error500>, 'error'>) => (
  // At this point of the route, we can't determine which language we're in
  // let's default to English
  <html lang="en">
    <head>
      <title>Hemi Portal</title>
      <link href="/favicon.ico" rel="icon" />
      <link href="https://fonts.googleapis.com" rel="preconnect" />
      <link href="https://fonts.gstatic.com" rel="preconnect" />
      <link rel="stylesheet" />
    </head>
    <body className="inter-font m-0 h-screen">
      <Error500
        {...props}
        // I couldn't find a way to read these from the translation files,
        // so I had to hardcode them :/
        description={
          <>
            An unexpected error has occurred. Please try again or
            <a
              className="text-orange-500 hover:text-orange-700"
              href={discordUrl}
            >
              {' '}
              contact us{' '}
            </a>
            if the problem persists.
          </>
        }
        reset={() => window.location.replace('/')}
        title="Something Went Wrong"
        tryAgainLabel="Try again"
      />
    </body>
  </html>
)

export default GlobalError
