import { FilterHeader } from 'components/table/_components/filterHeader'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, type RenderResult } from 'vitest-browser-react'

const labels = {
  all: 'All',
  deposits: 'Deposits',
  withdrawals: 'Withdrawals',
}

type Option = keyof typeof labels

const options: Option[] = ['all', 'deposits', 'withdrawals']

const renderFilterHeader = (onSelect = vi.fn()) =>
  render(
    <div style={{ height: 200, overflow: 'auto' }}>
      <p>Outside</p>
      <button type="button">Before</button>
      <FilterHeader
        getLabel={(option: Option) => labels[option]}
        onSelect={onSelect}
        options={options}
        selected="all"
        text="Type"
      />
      <button type="button">After</button>
      <div style={{ height: 500 }} />
    </div>,
  )

const getTrigger = (screen: RenderResult) =>
  screen.getByRole('button', { name: 'Type' })

const getOption = (screen: RenderResult, option: Option) =>
  screen.getByRole('button', { name: labels[option] })

const openMenu = (screen: RenderResult) => getTrigger(screen).click()

const expectClosed = async function (screen: RenderResult) {
  await expect
    .element(getTrigger(screen))
    .toHaveAttribute('aria-expanded', 'false')
  expect(getOption(screen, 'deposits').query()).toBeNull()
}

describe('FilterHeader', function () {
  it('opens and closes from the trigger', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)

    await expect
      .element(getTrigger(screen))
      .toHaveAttribute('aria-expanded', 'true')
    await Promise.all(
      options.map(option =>
        expect.element(getOption(screen, option)).toBeVisible(),
      ),
    )

    await getTrigger(screen).click()

    await expectClosed(screen)
  })

  it('focuses the first option when it opens', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)

    await expect.element(getOption(screen, 'all')).toHaveFocus()
  })

  it('marks the selected option as pressed', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)

    await expect
      .element(getOption(screen, 'all'))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(getOption(screen, 'deposits'))
      .toHaveAttribute('aria-pressed', 'false')
    await expect
      .element(getOption(screen, 'withdrawals'))
      .toHaveAttribute('aria-pressed', 'false')
  })

  it('selects another option, closes and focuses the trigger', async function () {
    const onSelect = vi.fn()
    const screen = await renderFilterHeader(onSelect)

    await openMenu(screen)
    await getOption(screen, 'deposits').click()

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('deposits')
    await expectClosed(screen)
    await expect.element(getTrigger(screen)).toHaveFocus()
  })

  it('does not call onSelect for the selected option', async function () {
    const onSelect = vi.fn()
    const screen = await renderFilterHeader(onSelect)

    await openMenu(screen)
    await getOption(screen, 'all').click()

    expect(onSelect).not.toHaveBeenCalled()
    await expectClosed(screen)
    await expect.element(getTrigger(screen)).toHaveFocus()
  })

  it('closes on a click outside', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    await screen.getByText('Outside').click()

    await expectClosed(screen)
  })

  it('closes on Escape and focuses the trigger', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    await userEvent.keyboard('{Escape}')

    await expectClosed(screen)
    await expect.element(getTrigger(screen)).toHaveFocus()
  })

  it('closes on Tab from the last option and moves past the trigger', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    getOption(screen, 'withdrawals').element().focus()
    await userEvent.tab()

    await expectClosed(screen)
    await expect
      .element(screen.getByRole('button', { name: 'After' }))
      .toHaveFocus()
  })

  it('moves to the next option on Tab from a middle option', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    getOption(screen, 'deposits').element().focus()
    await userEvent.tab()

    await expect.element(getOption(screen, 'withdrawals')).toHaveFocus()
    await expect
      .element(getTrigger(screen))
      .toHaveAttribute('aria-expanded', 'true')
  })

  it('closes on Shift+Tab from the first option and focuses the trigger', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    await expect.element(getOption(screen, 'all')).toHaveFocus()
    await userEvent.tab({ shift: true })

    await expectClosed(screen)
    await expect.element(getTrigger(screen)).toHaveFocus()
  })

  it('closes when the focus leaves the menu', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    screen.getByRole('button', { name: 'Before' }).element().focus()

    await expectClosed(screen)
  })

  it('stays open when the focus goes nowhere', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    await expect.element(getOption(screen, 'all')).toHaveFocus()
    getOption(screen, 'all').element().blur()

    await expect
      .element(getTrigger(screen))
      .toHaveAttribute('aria-expanded', 'true')
  })

  it('closes when a container scrolls', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    screen.container.firstElementChild?.dispatchEvent(new Event('scroll'))

    await expectClosed(screen)
  })

  it('closes on resize', async function () {
    const screen = await renderFilterHeader()

    await openMenu(screen)
    window.dispatchEvent(new Event('resize'))

    await expectClosed(screen)
  })
})
