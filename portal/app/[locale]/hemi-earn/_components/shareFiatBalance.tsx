'use client'

import { useQuery } from '@tanstack/react-query'
import { RenderFiatBalance } from 'components/fiatBalance'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { type EvmToken } from 'types/token'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { formatFiatNumber } from 'utils/format'
import { type Address } from 'viem'
import { convertToAssets } from 'viem-erc4626/actions'

type Props = {
  peggedToken: EvmToken
  shareAddress: Address
  shares: bigint
}

// Fiat-renders a share balance by first converting it to pegged-token units
// (`StakingVault.convertToAssets(shares)` on Ethereum) and then pricing
// against the pegged token. The share OFT (svetBTC, sVUSD) has no public
// price feed, but the pegged token (vBTC, vUSD) carries an
// `extensions.priceSymbol` that resolves through the standard portal price
// pipeline. Mirrors Vetro's `ShareTokenFiatValue`.
export const ShareFiatBalance = function ({
  peggedToken,
  shareAddress,
  shares,
}: Props) {
  const { data: assetsValue, status } = useQuery({
    enabled: shares > BigInt(0),
    queryFn: () =>
      convertToAssets(getEvmL1PublicClient(mainnet.id), {
        address: getStakingVaultForShare(shareAddress),
        shares,
      }),
    queryKey: ['hemi-earn', 'share-fiat', shareAddress, shares.toString()],
  })

  return (
    <RenderFiatBalance
      balance={assetsValue}
      customFormatter={usd => `$${formatFiatNumber(usd)}`}
      queryStatus={status}
      token={peggedToken}
    />
  )
}
