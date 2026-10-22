import { DisplayAmount } from 'components/displayAmount'
import { SubLogoTooltip } from 'components/subLogoTooltip'
import { TokenLogo } from 'components/tokenLogo'
import { TxLink } from 'components/txLink'
import { useHemiToken } from 'hooks/useHemiToken'
import { StakingPosition, StakingPositionStatus } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { formatUnits, isAddressEqual } from 'viem'
import { useAccount } from 'wagmi'

import { usePositionDelegationDetails } from '../_hooks/usePositionDelegationDetails'

type Props = {
  operation: StakingPosition
}

export const Amount = function ({ operation }: Props) {
  const t = useTranslations('hemi-stake')
  const { amount, owner, pastOwners, status, tokenId } = operation

  const { address: ownerAddress } = useAccount()
  const token = useHemiToken()

  const isWalletOwner = !!ownerAddress && isAddressEqual(owner, ownerAddress)
  const isWalletPastOwner =
    !!ownerAddress &&
    pastOwners.some(pastOwner => isAddressEqual(pastOwner, ownerAddress))
  const isTransferredPosition = !isWalletOwner && isWalletPastOwner

  const { data: delegationDetails } = usePositionDelegationDetails(tokenId, {
    enabled: isWalletOwner && status !== StakingPositionStatus.WITHDRAWN,
  })
  const isReceivedPosition = isWalletOwner && pastOwners.length > 0
  const isDelegatedAway = !!delegationDetails?.isDelegatedAway && isWalletOwner

  let delegationTooltip: string | undefined
  if (isReceivedPosition) {
    delegationTooltip = t('table.position-delegated-to-you')
  } else if (isDelegatedAway) {
    delegationTooltip = t('table.you-delegated-this-position')
  } else if (isTransferredPosition) {
    delegationTooltip = t('table.you-transferred-this-position')
  }

  return (
    <div className="flex items-center gap-x-5 text-neutral-950">
      <SubLogoTooltip tooltipText={delegationTooltip}>
        <div className="relative inline-flex items-center justify-center">
          <TokenLogo size="medium" token={token} version="L1" />
        </div>
      </SubLogoTooltip>
      <div className="flex flex-col">
        <div className="flex items-center gap-x-1.5">
          <DisplayAmount
            amount={formatUnits(BigInt(amount), token.decimals)}
            logoVersion="L1"
            showSymbol={false}
            token={token}
          />
          <span className="text-sm">{token.symbol}</span>
        </div>
        <span className="body-text-caption text-neutral-500">
          <TxLink
            chainId={token.chainId}
            textColor="neutral-500"
            txHash={operation.transactionHash}
          />
        </span>
      </div>
    </div>
  )
}
