import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'

const reloadKey = 'vite:preloadError:reloaded'

let reloadedThisLoad = false

const alreadyReloaded = function () {
  try {
    return sessionStorage.getItem(reloadKey) === 'true'
  } catch {
    return reloadedThisLoad
  }
}

const rememberReload = function () {
  reloadedThisLoad = true
  try {
    sessionStorage.setItem(reloadKey, 'true')
  } catch {
    // Nothing to do beyond the module-scope flag set above.
  }
}

// A deploy rotates the chunk hashes, so a tab left open across one asks for a
// name the server no longer has, and reloading picks up the fresh index.html.
// Once per session, so a chunk missing for any other reason falls through to
// the error boundary instead of reloading forever.
window.addEventListener(
  'vite:preloadError',
  function reloadOnStaleChunk(event) {
    if (alreadyReloaded()) {
      return
    }

    event.preventDefault()
    rememberReload()
    window.location.reload()
  },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
