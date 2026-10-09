import { SegmentedControl } from 'components/segmentedControl'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { type Token } from 'types/token'
import { useLocale, useTranslations } from 'use-intl'

import { getAmountPresets } from '../../_utils/amountPresets'

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
  const locale = useLocale()
  const t = useTranslations('hemi-stake')

  const { presets, walletPreset } = getAmountPresets({
    balance,
    decimals: token.decimals,
    locale,
  })

  const options =
    walletPreset === undefined
      ? presets
      : presets.concat({
          label: t('estimator.yours', { amount: walletPreset.label }),
          value: walletPreset.value,
        })

  const quickAmounts = (
    <SegmentedControl
      label={t('estimator.quick-amounts')}
      onChange={onChange}
      options={options}
      value={value}
    />
  )

  return (
    <TokenInput
      errorKey={undefined}
      footer={<div className="mt-3 sm:hidden">{quickAmounts}</div>}
      headerAction={<div className="hidden sm:block">{quickAmounts}</div>}
      label={t('amount')}
      onChange={onChange}
      showBalance={false}
      token={token}
      tokenSelector={<TokenSelectorReadOnly logoVersion="L1" token={token} />}
      value={value}
    />
  )
}
