// Next auto-loaded this by convention and Vite does not, so without the import
// no Sentry client is ever configured and every captureException is a no-op.
import './instrumentation-client'
import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'

const reloadKey = 'vite:preloadError:reloaded'

const alreadyReloaded = function () {
  try {
    return sessionStorage.getItem(reloadKey) === 'true'
  } catch {
    return true
  }
}

const canRememberReload = function () {
  try {
    sessionStorage.setItem(reloadKey, 'true')
    return sessionStorage.getItem(reloadKey) === 'true'
  } catch {
    return false
  }
}

// A deploy rotates the chunk hashes, so a tab left open across one asks for a
// name the server no longer has, and reloading picks up the fresh index.html.
// Once per session: a chunk missing for any other reason falls through to the
// error boundary rather than reloading in a loop.
window.addEventListener(
  'vite:preloadError',
  function reloadOnStaleChunk(event) {
    if (alreadyReloaded() || !canRememberReload()) {
      return
    }

    event.preventDefault()
    window.location.reload()
  },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
