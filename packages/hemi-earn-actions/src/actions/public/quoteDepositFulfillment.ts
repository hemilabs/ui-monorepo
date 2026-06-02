import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi'
import { getHemiEarnAgentAddress } from '../../constants'

// Reads the LayerZero native fee the Agent on Ethereum needs to send the
// fulfillment response (sVetToken OFT) back to the Router on Hemi. The
// caller passes this value as `callbackFee` into `quoteDeposit`
// (Hemi-side), which folds it into the total `msg.value` of `requestDeposit`.
//
// `share` is the **Ethereum-side staking vault (sVetToken) address** — the
// token being OFT-bridged back on the fulfillment leg. Since the
// `b071540 Stateless Agent` refactor the Agent no longer holds an
// `assetsData(asset)` mapping; the share has to be supplied directly.
// Resolve via `getStakingVaultForShare(shareOft)` on the portal.
export const quoteDepositFulfillment = async function ({
  agentAddress = getHemiEarnAgentAddress(),
  client,
  share,
}: {
  agentAddress?: Address
  client: Client
  share: Address
}): Promise<bigint> {
  if (isAddressEqual(share, zeroAddress)) {
    throw new Error(
      'quoteDepositFulfillment: `share` cannot be the zero address',
    )
  }

  return readContract(client, {
    abi: agentAbi,
    address: agentAddress,
    args: [share],
    functionName: 'quoteDepositFulfillment',
  })
}
