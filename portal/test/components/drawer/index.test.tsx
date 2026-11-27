import { Drawer, DrawerTopSection } from 'components/drawer'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, type RenderResult } from 'vitest-browser-react'

const content = 'Drawer content'

const heading = 'Drawer heading'

const nextFrame = () => new Promise(requestAnimationFrame)

const waitForOpen = () => nextFrame().then(nextFrame).then(nextFrame)

const getPanel = (screen: RenderResult) =>
  screen.getByText(content).element().parentElement

const endTransition = (target: Element | null, propertyName = 'transform') =>
  target?.dispatchEvent(
    new TransitionEvent('transitionend', { bubbles: true, propertyName }),
  )

const renderDrawer = (onClose?: VoidFunction) =>
  render(
    <>
      <button type="button">Outside</button>
      <Drawer onClose={onClose}>
        <p>{content}</p>
      </Drawer>
    </>,
  )

describe('Drawer', function () {
  it('renders the children in the given container', async function () {
    const container = document.createElement('div')
    document.body.append(container)

    try {
      await render(
        <Drawer container={container}>
          <p>{content}</p>
        </Drawer>,
      )

      expect(container).toHaveTextContent(content)
    } finally {
      container.remove()
    }
  })

  it('calls onClose right away when closed before it opens', async function () {
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockReturnValue(0)

    try {
      const onClose = vi.fn()
      await renderDrawer(onClose)

      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }))

      expect(onClose).toHaveBeenCalledOnce()
    } finally {
      requestAnimationFrame.mockRestore()
    }
  })

  it('closes on Escape once the closing animation ends', async function () {
    const onClose = vi.fn()
    const screen = await renderDrawer(onClose)
    await waitForOpen()

    await userEvent.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()

    endTransition(getPanel(screen))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes once open turns false and the closing animation ends', async function () {
    const onClose = vi.fn()
    const screen = await render(
      <Drawer onClose={onClose} open>
        <p>{content}</p>
      </Drawer>,
    )
    await waitForOpen()

    await screen.rerender(
      <Drawer onClose={onClose} open={false}>
        <p>{content}</p>
      </Drawer>,
    )

    expect(onClose).not.toHaveBeenCalled()

    endTransition(getPanel(screen))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores transitions other than the panel transform', async function () {
    const onClose = vi.fn()
    const screen = await renderDrawer(onClose)
    await waitForOpen()

    await userEvent.keyboard('{Escape}')
    endTransition(screen.getByText(content).element())
    endTransition(getPanel(screen), 'opacity')

    expect(onClose).not.toHaveBeenCalled()

    endTransition(getPanel(screen))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores a click outside until the opening click is over', async function () {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    try {
      const onClose = vi.fn()
      const screen = await renderDrawer(onClose)
      await waitForOpen()

      await screen.getByRole('button', { name: 'Outside' }).click()
      endTransition(getPanel(screen))

      expect(onClose).not.toHaveBeenCalled()

      vi.advanceTimersByTime(0)
      await screen.getByRole('button', { name: 'Outside' }).click()

      expect(onClose).not.toHaveBeenCalled()

      endTransition(getPanel(screen))

      expect(onClose).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes on a click outside once the closing animation ends', async function () {
    const onClose = vi.fn()
    const screen = await renderDrawer(onClose)
    await waitForOpen()

    await screen.getByRole('button', { name: 'Outside' }).click()

    expect(onClose).not.toHaveBeenCalled()

    endTransition(getPanel(screen))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on a click inside', async function () {
    const onClose = vi.fn()
    const screen = await renderDrawer(onClose)
    await waitForOpen()

    await screen.getByText(content).click()
    endTransition(getPanel(screen))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose only once when closed twice', async function () {
    const onClose = vi.fn()
    const screen = await renderDrawer(onClose)
    await waitForOpen()

    await userEvent.keyboard('{Escape}')
    await userEvent.keyboard('{Escape}')
    endTransition(getPanel(screen))
    endTransition(getPanel(screen))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('DrawerTopSection', function () {
  it('shows the heading', async function () {
    const screen = await render(<DrawerTopSection heading={heading} />)

    await expect
      .element(screen.getByRole('heading', { level: 2, name: heading }))
      .toBeVisible()
  })

  it('has no close button without onClose outside a Drawer', async function () {
    const screen = await render(<DrawerTopSection heading={heading} />)

    expect(screen.getByRole('button').query()).toBeNull()
  })

  it('calls its own onClose outside a Drawer', async function () {
    const onClose = vi.fn()
    const screen = await render(
      <DrawerTopSection heading={heading} onClose={onClose} />,
    )

    await screen.getByRole('button').click()

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes the Drawer with its animation when the Drawer has onClose', async function () {
    const onDrawerClose = vi.fn()
    const onTopSectionClose = vi.fn()
    const screen = await render(
      <Drawer onClose={onDrawerClose}>
        <DrawerTopSection heading={heading} onClose={onTopSectionClose} />
        <p>{content}</p>
      </Drawer>,
    )
    await waitForOpen()

    await screen.getByRole('button').click()

    expect(onDrawerClose).not.toHaveBeenCalled()

    endTransition(getPanel(screen))

    expect(onDrawerClose).toHaveBeenCalledOnce()
    expect(onTopSectionClose).not.toHaveBeenCalled()
  })

  it('calls its own onClose inside a Drawer without onClose', async function () {
    const onClose = vi.fn()
    const screen = await render(
      <Drawer>
        <DrawerTopSection heading={heading} onClose={onClose} />
      </Drawer>,
    )
    await waitForOpen()

    await screen.getByRole('button').click()

    expect(onClose).toHaveBeenCalledOnce()
  })
})
