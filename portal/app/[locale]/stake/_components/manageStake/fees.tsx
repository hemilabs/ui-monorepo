import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

type Props = {
  estimatedFees: bigint
}

export const Fees = function ({ estimatedFees }: Props) {
  const hemi = useHemi()
  const t = useTranslations('common')

  const nativeToken = getNativeToken(hemi.id)

  const gas = {
    amount: formatUnits(estimatedFees, hemi.nativeCurrency.decimals),
    label: t('network-gas-fee', { network: hemi.name }),
    token: nativeToken,
  }

  return (
    <div className="px-4">
      <EvmFeesSummary gas={gas} operationToken={nativeToken} />
    </div>
  )
}
