import { LockupPresets } from 'app/[locale]/hemi-stake/_components/lockup/lockupPresets'
import { type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

type PresetsProps = Omit<ComponentProps<typeof LockupPresets>, 'labelledBy'>

const presetOptions: PresetsProps['options'] = [
  { days: 180, label: '6 months' },
  { days: 366, label: '1 year' },
  { days: 732, label: '2 years' },
  { days: 1461, label: '4 years' },
]

const Presets = (props: PresetsProps) => (
  <>
    <span id="lockup-period-label">Lockup period</span>
    <LockupPresets labelledBy="lockup-period-label" {...props} />
  </>
)

const renderPresets = ({
  onSelect = vi.fn(),
  options = presetOptions,
  value = 732,
}: Partial<PresetsProps> = {}) =>
  render(<Presets onSelect={onSelect} options={options} value={value} />)

describe('LockupPresets', function () {
  it('is named by its label', async function () {
    const screen = await renderPresets()

    await expect
      .element(screen.getByRole('group', { name: 'Lockup period' }))
      .toBeVisible()
  })

  it('marks only the selected preset as pressed', async function () {
    const screen = await renderPresets()

    await expect
      .element(screen.getByRole('button', { name: '2 years' }))
      .toHaveAttribute('aria-pressed', 'true')
    await Promise.all(
      ['6 months', '1 year', '4 years'].map(name =>
        expect
          .element(screen.getByRole('button', { name }))
          .toHaveAttribute('aria-pressed', 'false'),
      ),
    )
  })

  it('marks no preset as pressed when the value matches none', async function () {
    const screen = await renderPresets({ value: 500 })

    await Promise.all(
      presetOptions.map(({ label }) =>
        expect
          .element(screen.getByRole('button', { name: label }))
          .toHaveAttribute('aria-pressed', 'false'),
      ),
    )
  })

  it('calls onSelect with the days of the clicked preset', async function () {
    const onSelect = vi.fn()
    const screen = await renderPresets({ onSelect })

    await screen.getByRole('button', { name: '1 year' }).click()

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(366)
  })

  it('moves the pressed state when the value changes', async function () {
    const screen = await renderPresets()

    await screen.rerender(
      <Presets onSelect={vi.fn()} options={presetOptions} value={180} />,
    )

    await expect
      .element(screen.getByRole('button', { name: '6 months' }))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(screen.getByRole('button', { name: '2 years' }))
      .toHaveAttribute('aria-pressed', 'false')
  })

  it('shows the sublabel inside its preset when given', async function () {
    const screen = await renderPresets({
      options: [
        { days: 180, label: '6 months', sublabel: '12.5% APY' },
        { days: 366, label: '1 year' },
      ],
    })

    await expect
      .element(
        screen.getByRole('button', { name: /6 months/ }).getByText('12.5% APY'),
      )
      .toBeVisible()
    await expect
      .element(screen.getByRole('button', { name: '1 year' }))
      .toHaveTextContent('1 year')
  })
})
