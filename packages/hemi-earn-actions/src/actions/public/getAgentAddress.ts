import {
  type Address,
  type Client,
  getAddress,
  isAddress,
  isAddressEqual,
  slice,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'

// Reads the LayerZero peer stored on the Router (Hemi-side) and decodes it into
// the Agent's address on Ethereum. The peer is stored as a left-padded bytes32,
// so the address is the trailing 20 bytes.
export const getAgentAddress = async function (
  client: Client,
  {
    routerAddress = getHemiEarnRouterAddress(),
  }: {
    routerAddress?: Address
  } = {},
): Promise<Address> {
  if (!client) {
    throw new Error('getAgentAddress: `client` is not defined')
  }
  if (!isAddress(routerAddress, { strict: false })) {
    throw new Error('getAgentAddress: `routerAddress` is not a valid address')
  }
  if (isAddressEqual(routerAddress, zeroAddress)) {
    throw new Error(
      'getAgentAddress: `routerAddress` cannot be the zero address',
    )
  }

  const peer = await readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    functionName: 'peerAddress',
  })

  return getAddress(slice(peer, 12))
}
