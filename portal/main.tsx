// Next auto-loaded this by convention and Vite does not, so without the import
// no Sentry client is ever configured and every captureException is a no-op.
import './instrumentation-client'
import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'

const reloadKey = 'vite:preloadError:reloaded'
const settledAfter = 10_000

const alreadyReloaded = function () {
  try {
    return sessionStorage.getItem(reloadKey) === 'true'
  } catch {
    return true
  }
}

const rememberReload = function () {
  try {
    sessionStorage.setItem(reloadKey, 'true')
  } catch {
    // Nothing to do: alreadyReloaded already fails safe without storage.
  }
}

// Running this long means the reload worked, so a later failure is another
// deploy rather than the same one looping.
setTimeout(function forgetReload() {
  try {
    sessionStorage.removeItem(reloadKey)
  } catch {
    // Nothing to remove.
  }
}, settledAfter)

// A deploy rotates the chunk hashes, so a tab left open across one asks for a
// name the server no longer has, and reloading picks up the fresh index.html.
// Guarded so a chunk missing for any other reason falls through to the error
// boundary instead of reloading forever.
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
