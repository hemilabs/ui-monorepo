import {
  type HemiPublicClient,
  type HemiWalletClient,
} from 'hooks/useHemiClient'
import { NetworkType } from 'hooks/useNetworkType'
import { EvmToken } from 'types/token'
import { getErc20TokenBalance } from 'utils/token'
import { type Address, Chain, parseUnits } from 'viem'

export const isStakeEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_STAKE_TESTNET === 'true'

/**
 * Determines if a user is able to stake or unstake a token
 *
 * @param params All the parameters needed to determine if a user can stake or unstake a token
 * @param amount The amount of tokens to stake/unstake
 * @param balance The balance the user has of the token
 * @param connectedChainId The chain Id the user is connected to
 * @param token The token to stake/unstake
 */
export const canSubmit = function ({
  amount,
  balance,
  connectedChainId,
  token,
}: {
  amount: bigint
  balance: bigint
  connectedChainId: Chain['id']
  token: EvmToken
}) {
  if (amount <= 0) {
    return { error: 'amount-less-equal-than-0' }
  }
  // this chain Id comes from the hemi client. It verifies that the token
  // is on expected hemi chain (hemi / testnet).
  if (connectedChainId !== token.chainId) {
    return { error: 'wrong-chain' }
  }
  if (balance <= 0) {
    return { error: 'not-enough-balance' }
  }
  if (amount > balance) {
    return { error: 'amount-larger-than-balance' }
  }
  return {}
}

const validateOperation = async function ({
  amount,
  from,
  hemiPublicClient,
  token,
}: {
  amount: bigint
  from: Address
  hemiPublicClient: HemiPublicClient
  token: EvmToken
}) {
  const balance = await getErc20TokenBalance({
    address: from,
    // It works in runtime, but Typescript fails to interpret HemiPublicClient as a Client.
    // I've seen that the typings change in future viem's version, so this may be soon fixed
    // @ts-expect-error hemiPublicClient is Client
    client: hemiPublicClient,
    token,
  })
  const { error } = canSubmit({
    amount,
    balance,
    connectedChainId: hemiPublicClient.chain.id,
    token,
  })
  if (error) {
    throw new Error(error)
  }
}

/**
 * Stakes an amount of a token in Hemi.
 * @param params All the parameters needed to determine if a user can stake a token
 * @param amount The amount of tokens to stake
 * @param from The address of the user that will stake
 * @param hemiPublicClient Hemi public client for read-only calls
 * @param hemiWalletClient Hemi Wallet client for signing transactions
 * @param token The token to stake
 */
export const stake = async function ({
  amount,
  from,
  hemiPublicClient,
  hemiWalletClient,
  token,
}: {
  amount: string
  from: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
  token: EvmToken
}) {
  const amountUnits = parseUnits(amount, token.decimals)
  await validateOperation({
    amount: amountUnits,
    from,
    hemiPublicClient,
    token,
  })

  return hemiWalletClient.stakeToken({
    amount: amountUnits,
    from,
    token,
  })
}

/**
 * Unstakes an amount of a token in Hemi.
 * @param params All the parameters needed to determine if a user can unstake a token
 * @param amount The amount of tokens to stake
 * @param from The address of the user that will unstake
 * @param hemiPublicClient Hemi public client for read-only calls
 * @param hemiWalletClient Hemi Wallet client for signing transactions
 * @param token The token to stake
 */
export const unstake = async function ({
  amount,
  from,
  hemiPublicClient,
  hemiWalletClient,
  token,
}: {
  amount: string
  from: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
  token: EvmToken
}) {
  const amountUnits = parseUnits(amount, token.decimals)
  // Here I am assuming that when the user stakes, we get a staked token
  // that can later be used to withdraw. That's why we need to check the balance of this staked token inside "validate operation"
  await validateOperation({
    amount: amountUnits,
    from,
    hemiPublicClient,
    token,
  })
  return hemiWalletClient.unstakeToken({
    amount: amountUnits,
    from,
    token,
  })
}
