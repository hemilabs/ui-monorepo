import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { type Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { sanitizeAmount } from 'utils/form'

import { getAmountPresets } from '../../_utils/amountPresets'

import { AmountPresets } from './amountPresets'

type Props = {
  balance: bigint | undefined
  onChange: (value: string) => void
  token: Token
  value: string
}

export const EstimatorAmountField = function ({
  balance,
  onChange,
  token,
  value,
}: Props) {
  const t = useTranslations('hemi-stake')

  const { presets, walletPreset } = getAmountPresets({
    balance,
    decimals: token.decimals,
  })

  const options =
    walletPreset === undefined
      ? presets
      : presets.concat({
          label: t('estimator.yours', { amount: walletPreset.label }),
          value: walletPreset.value,
        })

  const updateAmount = function (newValue: string) {
    const result = sanitizeAmount(newValue)
    if (!('error' in result)) {
      onChange(result.value)
    }
  }

  return (
    <TokenInput
      disabled={false}
      errorKey={undefined}
      headerAction={
        <AmountPresets
          label={t('estimator.quick-amounts')}
          onSelect={updateAmount}
          options={options}
          value={value}
        />
      }
      label={t('amount')}
      onChange={updateAmount}
      showBalance={false}
      token={token}
      tokenSelector={<TokenSelectorReadOnly logoVersion="L1" token={token} />}
      value={value}
    />
  )
}
