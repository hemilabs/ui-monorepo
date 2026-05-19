import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { gatewayAbi } from '../../vetro/gatewayAbi'

// Quotes the amount of pegged token (e.g. vUSD) produced by depositing
// `amountIn` of `tokenIn` (e.g. USDC) into the Vetro Gateway. Used by the
// portal to preview the first leg of the deposit pipeline (asset → vToken)
// before staking into the share vault.
export const previewGatewayDeposit = async function ({
  amountIn,
  client,
  gatewayAddress,
  tokenIn,
}: {
  amountIn: bigint
  client: Client
  gatewayAddress: Address
  tokenIn: Address
}): Promise<bigint> {
  if (isAddressEqual(gatewayAddress, zeroAddress)) {
    throw new Error(
      'previewGatewayDeposit: `gatewayAddress` cannot be the zero address',
    )
  }
  if (isAddressEqual(tokenIn, zeroAddress)) {
    throw new Error(
      'previewGatewayDeposit: `tokenIn` cannot be the zero address',
    )
  }
  if (amountIn <= BigInt(0)) {
    throw new Error(
      'previewGatewayDeposit: `amountIn` must be greater than zero',
    )
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: gatewayAddress,
    args: [tokenIn, amountIn],
    functionName: 'previewDeposit',
  })
}
