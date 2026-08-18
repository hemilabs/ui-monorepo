import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Placeholder entry: the routing step replaces this with the router tree,
// which is where translated copy starts coming from.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="p-6 text-neutral-950">Hemi Portal</div>
  </StrictMode>,
)
