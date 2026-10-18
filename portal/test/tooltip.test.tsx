import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// rc-tooltip needs a browser (and base.tsx pulls its CSS); the unit under test
// is components/tooltip/index.tsx, so the positioning layer is stubbed out.
vi.mock('../components/tooltip/base', () => ({
  BaseTooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="base">{children}</div>
  ),
}))

import { Tooltip } from '../components/tooltip'

describe('Tooltip screen-reader description (#2476)', function () {
  it('links a DOM-element trigger to an always-present description', function () {
    const html = renderToStaticMarkup(
      <Tooltip text="Slippage tolerance" variant="simple">
        <button type="button">info</button>
      </Tooltip>,
    )
    const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1]
    expect(describedBy).toBeTruthy()
    // The referenced element exists in the same static markup (no overlay needed).
    expect(html).toContain(`id="${describedBy}"`)
    expect(html).toContain('sr-only')
    expect(html).toContain('Slippage tolerance')
    // The button itself carries the link, not a wrapper div.
    expect(html).toMatch(/<button[^>]*aria-describedby/)
    expect(html).not.toContain('cursor-pointer')
  })

  it('keeps the wrapper for children that need it', function () {
    const FakeButton = () => <button type="button">x</button>
    const html = renderToStaticMarkup(
      <Tooltip text="hello" variant="simple">
        <FakeButton />
      </Tooltip>,
    )
    expect(html).toContain('cursor-pointer')
    expect(html).toContain('sr-only')
  })

  it('renders children unchanged when there is no text', function () {
    const html = renderToStaticMarkup(
      <Tooltip text={null} variant="simple">
        <button type="button">info</button>
      </Tooltip>,
    )
    expect(html).not.toContain('aria-describedby')
    expect(html).not.toContain('sr-only')
  })
})
