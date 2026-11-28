import { Modal } from 'components/modal'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, type RenderResult } from 'vitest-browser-react'

const content = 'Modal content'

const Overlay = () => <span>Overlay</span>

const renderModal = ({
  container,
  onClose = vi.fn(),
}: {
  container?: HTMLElement
  onClose?: VoidFunction
} = {}) =>
  render(
    <>
      <button type="button">Outside</button>
      <Modal container={container} onClose={onClose} overlay={Overlay}>
        <p>{content}</p>
      </Modal>
    </>,
  )

const getDialogParent = (screen: RenderResult) =>
  screen.getByText(content).element().closest('dialog')?.parentElement

const getMobileOverlay = (screen: RenderResult) =>
  screen.getByText('Overlay').nth(1).element()

describe('Modal', function () {
  it('renders the children in the given container', async function () {
    const container = document.createElement('div')
    document.body.append(container)

    try {
      const screen = await renderModal({ container })

      expect(getDialogParent(screen)).toBe(container)
    } finally {
      container.remove()
    }
  })

  it('renders in the app layout container when there is one', async function () {
    const appLayout = document.createElement('div')
    appLayout.id = 'app-layout-container'
    document.body.append(appLayout)

    try {
      const screen = await renderModal()

      expect(getDialogParent(screen)).toBe(appLayout)
    } finally {
      appLayout.remove()
    }
  })

  it('falls back to the document body', async function () {
    const screen = await renderModal()

    expect(getDialogParent(screen)).toBe(document.body)
  })

  it('calls onClose on Escape', async function () {
    const onClose = vi.fn()
    await renderModal({ onClose })

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on a click outside', async function () {
    const onClose = vi.fn()
    const screen = await renderModal({ onClose })

    await screen.getByRole('button', { name: 'Outside' }).click()

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on a mousedown inside the content', async function () {
    const onClose = vi.fn()
    const screen = await renderModal({ onClose })

    screen
      .getByText(content)
      .element()
      .dispatchEvent(new Event('mousedown', { bubbles: true }))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on a tap on the mobile overlay', async function () {
    const onClose = vi.fn()
    const screen = await renderModal({ onClose })

    getMobileOverlay(screen).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close through the outside listener on a touch inside the dialog', async function () {
    const onClose = vi.fn()
    const screen = await renderModal({ onClose })

    getMobileOverlay(screen).dispatchEvent(
      new Event('touchstart', { bubbles: true }),
    )

    expect(onClose).not.toHaveBeenCalled()
  })
})
