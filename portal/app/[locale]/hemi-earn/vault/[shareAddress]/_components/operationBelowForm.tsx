import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

import { CooldownWarning } from './cooldownWarning'
import { OperationSummary, type TopRowProps } from './operationSummary'

type Props = {
  account: Address | undefined
  bridgingFee: bigint | undefined
  ethereumFee: bigint | undefined
  hemiGasFee: bigint | undefined
  isCooldownEligible: boolean
  isFeesError: boolean
  nativeToken: EvmToken
  stakingVault: Address
  topRow: TopRowProps
  totalFees: bigint | undefined
}

export const OperationBelowForm = ({
  account,
  bridgingFee,
  ethereumFee,
  hemiGasFee,
  isCooldownEligible,
  isFeesError,
  nativeToken,
  stakingVault,
  topRow,
  totalFees,
}: Props) => (
  <div className="flex flex-col gap-y-4">
    <div className="px-4">
      <OperationSummary
        bridgingFee={bridgingFee}
        ethereumFee={ethereumFee}
        hemiGasFee={hemiGasFee}
        isFeesError={isFeesError}
        nativeToken={nativeToken}
        topRow={topRow}
        totalFees={totalFees}
      />
    </div>
    {account && isCooldownEligible && (
      <CooldownWarning stakingVault={stakingVault} />
    )}
  </div>
)
