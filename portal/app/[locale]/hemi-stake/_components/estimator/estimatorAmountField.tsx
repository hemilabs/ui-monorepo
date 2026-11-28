import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { TokenInput } from 'components/tokenInput'
import { TokenInputError } from 'components/tokenInput/error'
import { parseAmountInput } from 'components/tokenInput/utils'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useFormat } from 'hooks/useFormat'
import { useId } from 'react'
import { type Token } from 'types/token'
import { useTranslations } from 'use-intl'
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
  const formatter = useFormat()
  const t = useTranslations('hemi-stake')
  const tCommon = useTranslations('common')
  const errorId = useId()

  const amountUnits = parseAmountInput(value, token)
  const belowMinimum =
    amountUnits !== undefined && showsMinimumStakeWarning(amountUnits)
  const walletBelowMinimum = balance !== undefined && balance < minLockAmount

  const minimumMessage =
    belowMinimum || walletBelowMinimum
      ? tCommon('min-amount-stake', {
          amount: formatter.formatNumber(
            formatUnits(minLockAmount, token.decimals),
          ),
          symbol: token.symbol,
        })
      : undefined

  const { presets, walletPreset } = getAmountPresets({
    balance,
    decimals: token.decimals,
    formatter,
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
      bottomRight={
        <TokenInputError
          id={errorId}
          message={belowMinimum ? minimumMessage : undefined}
        />
      }
      errorId={errorId}
      errorKey={belowMinimum ? 'less-than-min-value' : undefined}
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
