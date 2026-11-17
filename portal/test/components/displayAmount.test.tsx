import { DisplayAmount } from 'components/displayAmount'
import { IntlProvider } from 'use-intl'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

const token = { decimals: 18, symbol: 'HEMI' }

const renderAmount = (amount: string, locale: string) =>
  render(
    <IntlProvider locale={locale} messages={{}}>
      <DisplayAmount
        amount={amount}
        showSymbol={false}
        showTooltip={false}
        token={token}
      />
    </IntlProvider>,
  )

describe('DisplayAmount', function () {
  it('formats the amount with the locale separators', async function () {
    const screen = await renderAmount('1234.5', 'es')

    await expect.element(screen.getByText('1.234,5')).toBeVisible()
  })

  it('does not add dots to an amount shown in full in another locale', async function () {
    const screen = await renderAmount('0.5', 'pt')

    await expect.element(screen.getByText('0,5', { exact: true })).toBeVisible()
  })

  it('adds dots to an amount that was rounded', async function () {
    const screen = await renderAmount('0.1234567', 'es')

    await expect.element(screen.getByText('0,123456...')).toBeVisible()
  })

  it('formats the below precision label with the locale', async function () {
    const screen = await renderAmount('0.0000001', 'es')

    await expect.element(screen.getByText('< 0,000001')).toBeVisible()
  })
})
