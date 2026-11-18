import { CopyButton } from 'components/copyButton'
import { IntlProvider } from 'use-intl'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const text = '0x1234abcd'

const renderCopyButton = (onCopy = vi.fn()) =>
  render(
    <IntlProvider
      locale="en"
      messages={{ common: { copied: 'Copied', copy: 'Copy' } }}
    >
      <CopyButton onCopy={onCopy} text={text} />
    </IntlProvider>,
  )

const nextFrame = () => new Promise(requestAnimationFrame)

const nextFrames = () => nextFrame().then(nextFrame)

describe('CopyButton', function () {
  it('copies the text, shows the copied state and calls onCopy', async function () {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)
    const onCopy = vi.fn()
    const screen = await renderCopyButton(onCopy)

    await screen.getByRole('button', { name: 'Copy' }).click()

    await expect
      .element(screen.getByRole('button', { name: 'Copied' }))
      .toBeVisible()
    expect(writeText).toHaveBeenCalledExactlyOnceWith(text)
    expect(onCopy).toHaveBeenCalledOnce()
  })

  it('shows a tooltip with the copy state on hover', async function () {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const screen = await renderCopyButton()
    const button = screen.getByRole('button', { name: 'Copy' })

    await button.hover()

    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Copy')

    await button.click()

    await expect
      .element(screen.getByRole('tooltip'))
      .toHaveTextContent('Copied')
  })

  it('goes back to the copy state after 3 seconds', async function () {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    try {
      const screen = await renderCopyButton()

      await screen.getByRole('button', { name: 'Copy' }).click()
      await expect
        .element(screen.getByRole('button', { name: 'Copied' }))
        .toBeVisible()

      vi.advanceTimersByTime(2999)
      await nextFrames()
      expect(
        screen.getByRole('button', { name: 'Copied' }).query(),
      ).not.toBeNull()

      vi.advanceTimersByTime(1)
      await expect
        .element(screen.getByRole('button', { name: 'Copy' }))
        .toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not show the copied state or call onCopy when the copy fails', async function () {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('Clipboard access denied'))
    const onCopy = vi.fn()
    const screen = await renderCopyButton(onCopy)

    await screen.getByRole('button', { name: 'Copy' }).click()

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    await expect
      .element(screen.getByRole('button', { name: 'Copy' }))
      .toBeVisible()
    expect(onCopy).not.toHaveBeenCalled()
  })
})
