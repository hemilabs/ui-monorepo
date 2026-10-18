import { Tooltip } from 'components/tooltip'
import { type ReactElement } from 'react'
import { prerender } from 'react-dom/static'
import { describe, expect, it } from 'vitest'

// The positioning layer is the real one on purpose: rc-tooltip replaces the
// aria-describedby of the element it receives as a child (#2476), so a stub here would
// hide the regression this file guards.
const render = async function (element: ReactElement) {
  const { prelude } = await prerender(element)
  let html = ''
  for await (const chunk of prelude) {
    html += Buffer.from(chunk).toString()
  }
  return html
}

const descriptionIdOf = (html: string) =>
  /<span aria-hidden="true" class="sr-only" id="([^"]+)"/.exec(html)?.[1]

describe('Tooltip screen-reader description (#2476)', function () {
  it('links a DOM-element trigger to an always-present description', async function () {
    const html = await render(
      <Tooltip text="Slippage tolerance" variant="simple">
        <button type="button">info</button>
      </Tooltip>,
    )
    const describedBy = descriptionIdOf(html)
    expect(describedBy).toBeTruthy()
    // The element inside the wrapper carries the link, so rc-tooltip's own clone of the
    // wrapper can't take it away.
    expect(html).toMatch(
      new RegExp(`<button[^>]*aria-describedby="${describedBy}"`),
    )
    expect(html).toContain('Slippage tolerance')
  })

  it('merges a pre-existing aria-describedby', async function () {
    const html = await render(
      <Tooltip text="hello" variant="simple">
        <button aria-describedby="other" type="button">
          info
        </button>
      </Tooltip>,
    )
    const describedBy = descriptionIdOf(html)
    expect(html).toMatch(
      new RegExp(`<button[^>]*aria-describedby="other ${describedBy}"`),
    )
  })

  it('keeps the description out of the accessible name of a wrapping button', async function () {
    const html = await render(
      <Tooltip text="hello" variant="simple">
        <button type="button">info</button>
      </Tooltip>,
    )
    expect(html).toMatch(/<span aria-hidden="true" class="sr-only"/)
  })

  it('wraps children that need it without claiming a link', async function () {
    const FakeButton = () => <button type="button">x</button>
    const html = await render(
      <Tooltip text="hello" variant="simple">
        <FakeButton />
      </Tooltip>,
    )
    expect(html).toContain('cursor-pointer')
    // The focusable element is the component's own, so there is no link to claim.
    expect(html).not.toContain('sr-only')
    expect(html).not.toContain('hello</span>')
  })

  it('never leaves a dangling reference for rich text', async function () {
    const html = await render(
      <Tooltip text={<span>rich(nodes)</span>} variant="simple">
        <button type="button">info</button>
      </Tooltip>,
    )
    expect(html).toContain('cursor-pointer')
    expect(html).not.toContain('sr-only')
  })

  it('renders children unchanged when there is no text', async function () {
    const html = await render(
      <Tooltip text={null} variant="simple">
        <button type="button">info</button>
      </Tooltip>,
    )
    expect(html).not.toContain('aria-describedby')
    expect(html).not.toContain('sr-only')
    expect(html).not.toContain('cursor-pointer')
  })
})
