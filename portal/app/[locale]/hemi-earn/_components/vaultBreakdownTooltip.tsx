import { type VaultBreakdown } from '../types'

import { TokenDisplay } from './tokenDisplay'

type Props = {
  vaultBreakdown: VaultBreakdown[]
}

export const VaultBreakdownTooltip = ({ vaultBreakdown }: Props) => (
  <div className="flex min-w-40 flex-col gap-y-1">
    {vaultBreakdown.map(vault => (
      <div
        className="flex items-center justify-between gap-x-4"
        key={`${vault.tokenChainId}-${vault.tokenAddress}`}
      >
        <div className="flex items-center gap-x-1">
          <TokenDisplay
            address={vault.tokenAddress}
            chainId={vault.tokenChainId}
            size="small"
          />
          <span className="body-text-medium text-white">{vault.name}</span>
        </div>
        <span className="body-text-medium text-white">{vault.value}</span>
      </div>
    ))}
  </div>
)
