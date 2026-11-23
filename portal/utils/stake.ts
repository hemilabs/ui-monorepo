import hemilabsTokenList from '@hemilabs/token-list'
import { validateInput } from 'components/tokenInput/utils'
import { stakedBalance, unstakeToken } from 'hemi-viem-stake-actions/actions'
import type { HemiWalletClient } from 'hooks/useHemiClient'
import { NetworkType } from 'hooks/useNetworkType'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import type { Address, Hash, PublicClient } from 'viem'

import { findChainById } from './chain'
import { parseTokenUnits } from './token'

export const isStakeEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  import.meta.env.VITE_ENABLE_STAKE_TESTNET === 'true'

type CanSubmit = Omit<Parameters<typeof validateInput>[0], 'token'> & {
  token: EvmToken
}

/**
 * Determines whether a staking operation can be submitted based on input validation
 * and user balance. This function only validates the input amount, balance, and token constraints.
 * Network chain validation is handled separately in validateUnstakeOperation.
 *
 * @param params - The parameters required to check if submission is allowed.
 * @param params.amountInput - The input amount of tokens for the operation (as a string).
 * @param params.balance - The user's current balance.
 * @param params.operation - The staking operation type (e.g., 'stake' or 'unstake').
 * @param params.t - Translation function for localization and error messages.
 * @param params.token - The token object, including its chain ID.
 * @returns An object indicating if submission is allowed, and any associated error message and key.
 */
export const canSubmit = function ({
  amountInput,
  balance,
  operation,
  t,
  token,
}: CanSubmit) {
  const inputValidation = validateInput({
    amountInput,
    balance,
    operation,
    t,
    token,
  })

  if (!inputValidation.isValid) {
    return {
      canSubmit: false,
      error: inputValidation.error,
      errorKey: inputValidation.errorKey,
    }
  }

  return { canSubmit: true, error: undefined, errorKey: undefined }
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
function getTokenAddress(token: EvmToken) {
  if (!isNativeToken(token)) {
    return token.address as Address
  }
  const wethToken = hemilabsTokenList.tokens.find(
    item => item.chainId === token.chainId && item.symbol === 'WETH',
  )
  if (!wethToken) {
    throw new Error('WETH token not found')
  }
  return wethToken.address as Address
}

const validateUnstakeOperation = async function ({
  amountInput,
  forAccount,
  hemiPublicClient,
  t,
  token,
}: {
  forAccount: Address
  hemiPublicClient: PublicClient
} & Pick<CanSubmit, 'amountInput' | 't' | 'token'>) {
  if (hemiPublicClient.chain?.id !== token.chainId) {
    throw new Error(
      t('common.connect-to-network', {
        network: findChainById(token.chainId)!.name,
      }),
    )
  }

  const balance = await stakedBalance(hemiPublicClient, {
    address: forAccount,
    tokenAddress: getTokenAddress(token),
  })
  const { error } = canSubmit({
    amountInput,
    balance,
    operation: 'unstake',
    t,
    token,
  })
  if (error) {
    throw new Error(error)
  }
}

type UnstakeEvents = Partial<{
  onUnstake: () => void
  onUnstakeConfirmed: () => void
  onUnstakeFailed: () => void
  onUserRejectedUnstake: () => void
  onUserSignedUnstake: (hash: Hash) => void
}>

/**
 * Handles the unstaking process for a given account and token.
 *
 * @param params - The parameters for the unstake operation.
 * @param params.amountInput - The input amount of tokens for the operation (as a string).
 * @param params.forAccount - The address of the account performing the unstake.
 * @param params.hemiPublicClient - The public client instance for blockchain interactions.
 * @param params.hemiWalletClient - The wallet client instance for signing transactions.
 * @param params.t - Translation function for localization and error messages.
 * @param params.token - The token being unstaked.
 * @param params.onUnstake - Optional callback invoked before the unstake transaction is sent.
 * @param params.onUnstakeConfirmed - Optional callback invoked when the unstake transaction is confirmed.
 * @param params.onUnstakeFailed - Optional callback invoked if the unstake transaction fails.
 * @param params.onUserRejectedUnstake - Optional callback invoked if the user rejects the unstake transaction.
 * @param params.onUserSignedUnstake - Optional callback invoked after the user signs the unstake transaction.
 * @returns A promise that resolves when the unstake process is complete.
 */
export const unstake = async function ({
  amountInput,
  forAccount,
  hemiPublicClient,
  hemiWalletClient,
  onUnstake,
  onUnstakeConfirmed,
  onUnstakeFailed,
  onUserRejectedUnstake,
  onUserSignedUnstake,
  t,
  token,
}: {
  forAccount: Address
  hemiPublicClient: PublicClient
  hemiWalletClient: HemiWalletClient
} & Pick<CanSubmit, 'amountInput' | 't' | 'token'> &
  UnstakeEvents) {
  if (!hemiWalletClient) {
    throw new Error('Hemi wallet client not initialized')
  }

  await validateUnstakeOperation({
    amountInput,
    forAccount,
    hemiPublicClient,
    t,
    token,
  })

  onUnstake?.()

  const amount = parseTokenUnits(amountInput, token)

  const unstakeTransactionHash = await unstakeToken(hemiWalletClient, {
    amount,
    forAccount,
    tokenAddress: getTokenAddress(token),
  }).catch(onUserRejectedUnstake)

  if (!unstakeTransactionHash) {
    return
  }

  onUserSignedUnstake?.(unstakeTransactionHash)

  const receipt = await hemiPublicClient
    .waitForTransactionReceipt({
      hash: unstakeTransactionHash,
    })
    .catch(onUnstakeFailed)

  // if receipt is null, it's already handled on the .catch() above
  if (!receipt) {
    return
  }

  if (receipt.status === 'success') {
    onUnstakeConfirmed?.()
  } else {
    onUnstakeFailed?.()
  }
}
