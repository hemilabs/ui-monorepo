import { type Formatter } from 'utils/format'
import { formatUnits } from 'viem'

const presetAmounts = [1_000, 10_000, 100_000]

// Anything smaller compacts to a label reading "0", which would offer a chip
// that says nothing and fills the field with dust.
const minWalletAmount = 0.01

const toCompactLabel = function (amount: number, formatter: Formatter) {
  const { number, suffix } = formatter.formatCompactFiatParts(
    amount,
    2,
    'trunc',
  )
  return `${number}${suffix}`
}

export const getAmountPresets = function ({
  balance,
  decimals,
  formatter,
}: {
  balance: bigint | undefined
  decimals: number
  formatter: Formatter
}) {
  const presets = presetAmounts.map(amount => ({
    label: toCompactLabel(amount, formatter),
    value: amount.toString(),
  }))

  if (balance === undefined) {
    return { presets, walletPreset: undefined }
  }

  const walletAmount = formatUnits(balance, decimals)
  const isWorthShowing =
    Number(walletAmount) >= minWalletAmount &&
    !presets.some(preset => preset.value === walletAmount)

  return {
    presets,
    walletPreset: isWorthShowing
      ? {
          label: toCompactLabel(Number(walletAmount), formatter),
          value: walletAmount,
        }
      : undefined,
  }
}
