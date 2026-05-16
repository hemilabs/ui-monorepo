import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { gatewayAbi } from '../../vetro/gatewayAbi'

// Quotes the amount of `tokenOut` (e.g. USDC) produced by redeeming
// `peggedTokenIn` of the gateway's pegged token (e.g. vUSD) via the Vetro
// Gateway. Used by the portal to preview the second leg of the redeem
// pipeline (vToken → asset) after unstaking.
export const previewGatewayRedeem = async function ({
  client,
  gatewayAddress,
  peggedTokenIn,
  tokenOut,
}: {
  client: Client
  gatewayAddress: Address
  peggedTokenIn: bigint
  tokenOut: Address
}): Promise<bigint> {
  if (gatewayAddress === zeroAddress) {
    throw new Error(
      'previewGatewayRedeem: `gatewayAddress` cannot be the zero address',
    )
  }
  if (tokenOut === zeroAddress) {
    throw new Error(
      'previewGatewayRedeem: `tokenOut` cannot be the zero address',
    )
  }
  if (peggedTokenIn <= BigInt(0)) {
    throw new Error(
      'previewGatewayRedeem: `peggedTokenIn` must be greater than zero',
    )
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: gatewayAddress,
    args: [tokenOut, peggedTokenIn],
    functionName: 'previewRedeem',
  })
}
