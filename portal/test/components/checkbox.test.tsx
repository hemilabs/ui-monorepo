import { Checkbox } from 'components/checkbox'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

const labelText = 'Accept the terms'

const getTicks = (container: HTMLElement) => container.querySelectorAll('svg')

describe('Checkbox', function () {
  it('is named by its label', async function () {
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={vi.fn()} />,
    )

    await expect
      .element(screen.getByRole('checkbox', { name: labelText }))
      .toBeVisible()
  })

  it('calls onChange when the label text is clicked', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={onChange} />,
    )

    await screen.getByText(labelText).click()

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('calls onChange with true when it is not checked', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={onChange} />,
    )

    await screen.getByRole('checkbox').click()

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('calls onChange with false when it is checked', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <Checkbox checked label={labelText} onChange={onChange} />,
    )

    await screen.getByRole('checkbox').click()

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('leaves the checked state to the parent', async function () {
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={vi.fn()} />,
    )
    const checkbox = screen.getByRole('checkbox')

    await checkbox.click()

    await expect.element(checkbox).not.toBeChecked()
  })

  it('reflects a new checked value from the parent', async function () {
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={vi.fn()} />,
    )
    const checkbox = screen.getByRole('checkbox')

    await expect.element(checkbox).not.toBeChecked()

    await screen.rerender(
      <Checkbox checked label={labelText} onChange={vi.fn()} />,
    )

    await expect.element(checkbox).toBeChecked()
  })

  it('shows the tick only when it is checked', async function () {
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={vi.fn()} />,
    )

    expect(getTicks(screen.container)).toHaveLength(0)

    await screen.rerender(
      <Checkbox checked label={labelText} onChange={vi.fn()} />,
    )

    await expect.poll(() => getTicks(screen.container)).toHaveLength(1)
  })

  it('toggles with the space key', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <Checkbox checked={false} label={labelText} onChange={onChange} />,
    )
    const checkbox = screen.getByRole('checkbox')

    await userEvent.tab()
    await expect.element(checkbox).toHaveFocus()
    await userEvent.keyboard(' ')

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('forwards its ref to the input so it can take focus', async function () {
    const ref = createRef<HTMLInputElement>()
    const screen = await render(
      <Checkbox
        checked={false}
        label={labelText}
        onChange={vi.fn()}
        ref={ref}
      />,
    )

    ref.current?.focus()

    await expect.element(screen.getByRole('checkbox')).toHaveFocus()
  })
})
