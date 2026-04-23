import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { TxLink } from 'components/txLink'
import { useHemiToken } from 'hooks/useHemiToken'
import { StakingPosition } from 'types/stakingDashboard'
import { Address, formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { usePositionDelegationDetails } from '../_hooks/usePositionDelegationDetails'

import { DelegationIndicators } from './stakeTable/delegationIndicators'

type Props = {
  operation: StakingPosition
}

export const Amount = function ({ operation }: Props) {
  const { amount, owner, pastOwners, tokenId } = operation

  const { address } = useAccount()
  const token = useHemiToken()
  const { data: delegationDetails } = usePositionDelegationDetails(tokenId)

  const isWalletOwner =
    !!address && owner.toLowerCase() === address.toLowerCase()
  const isReceivedPosition = isWalletOwner && pastOwners.length > 0
  const isDelegatedAway = !!delegationDetails?.isDelegatedAway && isWalletOwner
  const delegatedAddress = delegationDetails?.delegatee as Address | undefined

  return (
    <div className="flex items-center gap-x-5 text-neutral-950">
      <TokenLogo size="medium" token={token} version="L1" />
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
        <span className="text-xs font-normal text-neutral-500">
          <TxLink
            chainId={token.chainId}
            textColor="neutral-500"
            txHash={operation.transactionHash}
          />
        </span>
        <DelegationIndicators
          delegatedAddress={delegatedAddress}
          isDelegatedAway={isDelegatedAway}
          isReceivedPosition={isReceivedPosition}
        />
      </div>
    </div>
  )
}
