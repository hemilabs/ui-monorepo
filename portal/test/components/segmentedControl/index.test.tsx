import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

type Period = 'day' | 'week'

const options: SegmentedControlOption<Period>[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
]

describe('SegmentedControl', function () {
  it('renders a group named by label', async function () {
    const screen = await render(
      <SegmentedControl<Period>
        label="Period"
        onChange={vi.fn()}
        options={options}
        value="day"
      />,
    )

    await expect
      .element(screen.getByRole('group', { name: 'Period' }))
      .toBeVisible()
  })

  it('marks only the selected option as pressed', async function () {
    const screen = await render(
      <SegmentedControl<Period>
        label="Period"
        onChange={vi.fn()}
        options={options}
        value="day"
      />,
    )

    await expect
      .element(screen.getByRole('button', { name: 'Day' }))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(screen.getByRole('button', { name: 'Week' }))
      .toHaveAttribute('aria-pressed', 'false')
  })

  it('selects the option that matches a new value from the parent', async function () {
    const screen = await render(
      <SegmentedControl<Period>
        label="Period"
        onChange={vi.fn()}
        options={options}
        value="day"
      />,
    )

    await screen.rerender(
      <SegmentedControl<Period>
        label="Period"
        onChange={vi.fn()}
        options={options}
        value="week"
      />,
    )

    await expect
      .element(screen.getByRole('button', { name: 'Day' }))
      .toHaveAttribute('aria-pressed', 'false')
    await expect
      .element(screen.getByRole('button', { name: 'Week' }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onChange with the value of an option that is not selected', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <SegmentedControl<Period>
        label="Period"
        onChange={onChange}
        options={options}
        value="day"
      />,
    )

    await screen.getByRole('button', { name: 'Week' }).click()

    expect(onChange).toHaveBeenCalledExactlyOnceWith('week')
  })

  it('does not call onChange when the selected option is clicked', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <SegmentedControl<Period>
        label="Period"
        onChange={onChange}
        options={options}
        value="day"
      />,
    )

    await screen.getByRole('button', { name: 'Day' }).click()

    expect(onChange).not.toHaveBeenCalled()
  })
})
