import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

import { CooldownWarning } from './cooldownWarning'
import { OperationSummary, type TopRowProps } from './operationSummary'
import { type VetroFeeRowProps } from './vetroFeeRow'

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
  vetroFee: VetroFeeRowProps
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
  vetroFee,
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
        vetroFee={vetroFee}
      />
    </div>
    {account && isCooldownEligible && (
      <CooldownWarning stakingVault={stakingVault} />
    )}
  </div>
)
