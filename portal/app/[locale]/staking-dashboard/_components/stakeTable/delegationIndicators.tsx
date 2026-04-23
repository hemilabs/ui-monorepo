import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'
import { Address } from 'viem'

type Props = {
  delegatedAddress: Address | undefined
  isDelegatedAway: boolean
  isReceivedPosition: boolean
}

export const DelegationIndicators = function ({
  delegatedAddress,
  isDelegatedAway,
  isReceivedPosition,
}: Props) {
  const t = useTranslations('staking-dashboard')

  if (!isDelegatedAway && !isReceivedPosition) {
    return null
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {isDelegatedAway && delegatedAddress && (
        <Tooltip
          text={t('table.delegated-to-address', {
            address: delegatedAddress,
          })}
          variant="simple"
        >
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            {t('table.delegated')}
          </span>
        </Tooltip>
      )}
      {isReceivedPosition && (
        <Tooltip
          text={t('table.received-from-previous-owner')}
          variant="simple"
        >
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {t('table.received')}
          </span>
        </Tooltip>
      )}
    </div>
  )
}
