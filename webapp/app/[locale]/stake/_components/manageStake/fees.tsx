import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { formatUnits } from 'viem'

import { useEstimateStakeFees } from '../../_hooks/useEstimateStakeFees'
import { useEstimateUnstakeFees } from '../../_hooks/useEstimateUnstakeFees'

const Fees = function ({ estimatedFees }: { estimatedFees: bigint }) {
  const hemi = useHemi()
  const t = useTranslations('common')

  const gas = {
    amount: formatUnits(estimatedFees, hemi.nativeCurrency.decimals),
    label: t('network-gas-fee', { network: hemi.name }),
    symbol: hemi.nativeCurrency.symbol,
  }

  return (
    <div className="px-4">
      <EvmFeesSummary gas={gas} operationSymbol={hemi.nativeCurrency.symbol} />
    </div>
  )
}

export const StakeFees = () => <Fees estimatedFees={useEstimateStakeFees()} />

export const UnstakeFees = () => (
  <Fees estimatedFees={useEstimateUnstakeFees()} />
)
