import { SearchInput } from 'components/inputText'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

const getIcons = (container: HTMLElement) => container.querySelectorAll('svg')

const ControlledSearchInput = function () {
  const [value, setValue] = useState('')
  return (
    <SearchInput
      aria-label="Search"
      onChange={e => setValue(e.target.value)}
      onClear={() => setValue('')}
      value={value}
    />
  )
}

describe('SearchInput', function () {
  it('passes the typed value to onChange', async function () {
    const screen = await render(<ControlledSearchInput />)
    const input = screen.getByRole('textbox', { name: 'Search' })

    await input.fill('hemi')

    await expect.element(input).toHaveValue('hemi')
  })

  it('shows the clear icon after typing and hides it after clearing the value', async function () {
    const screen = await render(<ControlledSearchInput />)
    const input = screen.getByRole('textbox', { name: 'Search' })

    expect(getIcons(screen.container)).toHaveLength(1)

    await input.fill('hemi')

    await expect.poll(() => getIcons(screen.container)).toHaveLength(2)

    await userEvent.click(getIcons(screen.container)[0])

    await expect.element(input).toHaveValue('')
    await expect.poll(() => getIcons(screen.container)).toHaveLength(1)
  })

  it('does not show the clear icon when the value is empty', async function () {
    const screen = await render(
      <SearchInput aria-label="Search" onClear={vi.fn()} readOnly value="" />,
    )

    expect(getIcons(screen.container)).toHaveLength(1)
  })

  it('does not show the clear icon when onClear is not given', async function () {
    const screen = await render(
      <SearchInput aria-label="Search" readOnly value="hemi" />,
    )

    expect(getIcons(screen.container)).toHaveLength(1)
  })

  it('shows the clear icon and calls onClear when it is clicked', async function () {
    const onClear = vi.fn()
    const screen = await render(
      <SearchInput
        aria-label="Search"
        onClear={onClear}
        readOnly
        value="hemi"
      />,
    )
    const icons = getIcons(screen.container)

    expect(icons).toHaveLength(2)
    await userEvent.click(icons[0])

    expect(onClear).toHaveBeenCalledOnce()
  })
})
