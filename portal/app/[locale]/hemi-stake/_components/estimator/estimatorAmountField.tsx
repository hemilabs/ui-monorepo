import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { TokenInput } from 'components/tokenInput'
import { parseAmountInput } from 'components/tokenInput/utils'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { type Token } from 'types/token'
import { useLocale, useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'
import { minLockAmount } from 've-hemi-actions'
import { formatUnits } from 'viem'

import { getAmountPresets } from '../../_utils/amountPresets'
import { showsMinimumStakeWarning } from '../../_utils/minimumStake'

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
  const tCommon = useTranslations('common')

  const amountUnits = parseAmountInput(value, token)
  const belowMinimum =
    amountUnits !== undefined && showsMinimumStakeWarning(amountUnits)
  const walletBelowMinimum = balance !== undefined && balance < minLockAmount

  const minimumMessage =
    belowMinimum || walletBelowMinimum
      ? tCommon('min-amount-stake', {
          amount: formatNumber(
            formatUnits(minLockAmount, token.decimals),
            locale,
          ),
          symbol: token.symbol,
        })
      : undefined

  const { presets, walletPreset } = getAmountPresets({
    balance,
    decimals: token.decimals,
    locale,
  })

  const walletOption: SegmentedControlOption<string> | undefined =
    walletPreset === undefined
      ? undefined
      : {
          disabled: walletBelowMinimum,
          label: t('estimator.yours', { amount: walletPreset.label }),
          tooltip: walletBelowMinimum ? minimumMessage : undefined,
          value: walletPreset.value,
        }

  const options = walletOption ? [...presets, walletOption] : presets

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
      errorKey={belowMinimum ? 'less-than-min-value' : undefined}
      errorMessage={belowMinimum ? minimumMessage : undefined}
      footer={<div className="mt-3 sm:hidden">{quickAmounts}</div>}
      headerAction={<div className="hidden sm:block">{quickAmounts}</div>}
      label={t('amount')}
      onChange={onChange}
      token={token}
      tokenSelector={<TokenSelectorReadOnly logoVersion="L1" token={token} />}
      value={value}
    />
  )
}
