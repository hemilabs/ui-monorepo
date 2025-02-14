import hemilabsTokenList from '@hemilabs/token-list'
import {
  type HemiPublicClient,
  type HemiWalletClient,
} from 'hooks/useHemiClient'
import { NetworkType } from 'hooks/useNetworkType'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
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
  forAccount,
  hemiPublicClient,
  token,
}: {
  amount: bigint
  forAccount: Address
  hemiPublicClient: HemiPublicClient
  token: EvmToken
}) {
  const balance = await getErc20TokenBalance({
    address: forAccount,
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
 * Retrieves the appropriate token address based on whether the token is native or ERC-20.
 * If the token is native, it fetches the WETH address from the provided token list.
 * Throws an error if WETH is not found in the token list.
 *
 * @param token - The token for which the address is needed.
 * @returns The address of the token as a string in the `Address` type format.
 * @throws Error if the token is native but WETH is not found in the token list.
 */
function getTokenAddress(token: EvmToken): Address {
  if (isNativeToken(token)) {
    const wethToken = hemilabsTokenList.tokens.find(
      item => item.chainId === token.chainId && item.symbol === 'WETH',
    )
    if (!wethToken) {
      throw new Error('WETH token not found')
    }
    return wethToken.address as Address
  }

  return token.address as Address
}

/**
 * Stakes an amount of a token in Hemi.
 * @param params All the parameters needed to determine if a user can stake a token
 * @param amount The amount of tokens to stake
 * @param forAccount The address of the user that will stake
 * @param hemiPublicClient Hemi public client for read-only calls
 * @param hemiWalletClient Hemi Wallet client for signing transactions
 * @param token The token to stake
 */
export const stake = async function ({
  amount,
  forAccount,
  hemiPublicClient,
  hemiWalletClient,
  token,
}: {
  amount: string
  forAccount: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
  token: EvmToken
}) {
  const amountUnits = parseUnits(amount, token.decimals)
  await validateOperation({
    amount: amountUnits,
    forAccount,
    hemiPublicClient,
    token,
  })

  if (isNativeToken(token)) {
    return hemiWalletClient.stakeETHToken({
      amount: amountUnits,
      forAccount,
    })
  }

  return hemiWalletClient.stakeERC20Token({
    amount: amountUnits,
    forAccount,
    tokenAddress: token.address as Address,
  })
}

/**
 * Unstakes an amount of a token in Hemi.
 * @param params All the parameters needed to determine if a user can unstake a token
 * @param amount The amount of tokens to stake
 * @param forAccount The address of the user that will unstake
 * @param hemiPublicClient Hemi public client for read-only calls
 * @param hemiWalletClient Hemi Wallet client for signing transactions
 * @param token The token to stake
 */
export const unstake = async function ({
  amount,
  forAccount,
  hemiPublicClient,
  hemiWalletClient,
  token,
}: {
  amount: string
  forAccount: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
  token: EvmToken
}) {
  const amountUnits = parseUnits(amount, token.decimals)
  // Here I am assuming that when the user stakes, we get a staked token
  // that can later be used to withdraw. That's why we need to check the balance of this staked token inside "validate operation"

  await validateOperation({
    amount: amountUnits,
    forAccount,
    hemiPublicClient,
    token,
  })

  return hemiWalletClient.unstakeToken({
    amount: amountUnits,
    forAccount,
    tokenAddress: getTokenAddress(token),
  })
}
