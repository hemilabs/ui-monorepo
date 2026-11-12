import { CopyButton } from 'components/copyButton'
import { ExternalLink } from 'components/externalLink'
import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'use-intl'
import { formatEvmHash } from 'utils/format'
import { type Address, type Hash } from 'viem'

import { vetroSupportUrl } from '../_constants/vetro'
import { useRemoteFailedState } from '../_hooks/useRemoteFailedState'
import { useVaultMetadata } from '../_hooks/useVaultMetadata'
import { isTransferDelayed, transferDeadline } from '../_utils/inTransit'
import { type EarnTransaction } from '../types'
import { useEarnCooldownRemaining } from '../vault/[shareAddress]/_hooks/useEarnCooldownRemaining'

export const TransferIncompleteBanner = function ({
  heading,
  note,
  requestTxHash,
}: {
  heading?: string
  note?: string
  requestTxHash: Hash
}) {
  const t = useTranslations('hemi-earn.transactions.banner')
  return (
    <div className="px-4 py-6 md:px-6">
      <WarningBox heading={heading} subheading={t('transfer-incomplete')}>
        <div className="mt-2 flex items-center gap-x-2">
          <span className="text-neutral-950">
            {formatEvmHash(requestTxHash)}
          </span>
          <CopyButton text={requestTxHash} />
        </div>
        <div className="flex">
          <ExternalLink
            className="hoverable-text font-medium underline"
            href={vetroSupportUrl}
          >
            {t('contact-support')}
          </ExternalLink>
        </div>
        {note ? <p className="mt-2 text-neutral-500">{note}</p> : null}
      </WarningBox>
    </div>
  )
}

export const TransferDelayedBanner = function ({
  isCrossing,
  stakingVault,
  transaction,
}: {
  isCrossing: boolean
  stakingVault: Address
  transaction: EarnTransaction | undefined
}) {
  const vaultMetadata = useVaultMetadata(stakingVault)
  const secondsRemaining = useEarnCooldownRemaining(
    transferDeadline({
      maxTransferSeconds: vaultMetadata?.maxTransferSeconds,
      processedAt: transaction?.processedAt,
      requestedAt: transaction?.requestedAt,
    }),
  )
  const { show: remoteFailedShown } = useRemoteFailedState(transaction)

  if (
    !transaction ||
    remoteFailedShown ||
    !isTransferDelayed({ isCrossing, secondsRemaining, transaction })
  ) {
    return null
  }
  return <TransferIncompleteBanner requestTxHash={transaction.requestTxHash} />
}
