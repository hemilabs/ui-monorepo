import hemilabsTokenList from '@hemilabs/token-list'
import { validateInput } from 'components/tokenInput/utils'
import { stakeManagerAddresses } from 'hemi-viem-stake-actions'
import type { HemiPublicClient, HemiWalletClient } from 'hooks/useHemiClient'
import { NetworkType } from 'hooks/useNetworkType'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import type { Address, Hash, TransactionReceipt } from 'viem'
import { allowance, approve, balanceOf } from 'viem-erc20/actions'

import { findChainById } from './chain'
import { parseTokenUnits } from './token'

export const isStakeEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_STAKE_TESTNET === 'true'

type CanSubmit = Omit<Parameters<typeof validateInput>[0], 'token'> & {
  token: EvmToken
}

/**
 * Determines whether a staking operation can be submitted based on input validation
 * and user balance. This function only validates the input amount, balance, and token constraints.
 * Network chain validation is handled separately in validateStakeOperation and validateUnstakeOperation.
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

const validateStakeOperation = async function ({
  amountInput,
  forAccount,
  hemiPublicClient,
  t,
  token,
}: {
  forAccount: Address
  hemiPublicClient: HemiPublicClient
} & Pick<CanSubmit, 'amountInput' | 't' | 'token'>) {
  if (hemiPublicClient.chain?.id !== token.chainId) {
    throw new Error(
      t('common.connect-to-network', {
        network: findChainById(token.chainId)!.name,
      }),
    )
  }

  const balance = isNativeToken(token)
    ? await hemiPublicClient.getBalance({
        address: forAccount,
      })
    : await balanceOf(hemiPublicClient, {
        account: forAccount,
        // @ts-expect-error token is not native, so token.address is address
        address: token.address,
      })

  const { error } = canSubmit({
    amountInput,
    balance,
    operation: 'stake',
    t,
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

type StakeEvents = Partial<{
  onStake: () => void
  onStakeConfirmed: () => void
  onStakeFailed: () => void
  onStakeTokenApprovalFailed: () => void
  onStakeTokenApproved: () => void
  onTokenApprove: () => void
  onUserRejectedStake: () => void
  onUserRejectedTokenApproval: () => void
  onUserSignedStake: (hash: Hash) => void
  onUserSignedTokenApproval: (hash: Hash) => void
}>

/**
 * Stakes an amount of a token in Hemi.
 *
 * Handles both native and ERC-20 tokens. For ERC-20 tokens, checks allowance and requests approval if needed.
 * Invokes the appropriate callbacks at each stage of the staking process, including approval, signing, confirmation, and failure.
 *
 * @param params - All the parameters needed to determine if a user can stake a token.
 * @param params.amountInput - The input amount of tokens for the operation (as a string).
 * @param params.forAccount - The address of the user that will stake.
 * @param params.hemiPublicClient - Hemi public client for read-only blockchain calls.
 * @param params.hemiWalletClient - Hemi Wallet client for signing transactions.
 * @param params.t - Translation function for localization and error messages.
 * @param params.token - The token to stake.
 * @param params.onStake - Optional callback to run prior to prompting the user to sign a Stake transaction.
 * @param params.onStakeConfirmed - Optional callback for the Stake transaction confirmation.
 * @param params.onStakeFailed - Optional callback for the Stake transaction failure.
 * @param params.onStakeTokenApprovalFailed - Optional callback for the Token approval transaction failure.
 * @param params.onStakeTokenApproved - Optional callback after the token is approved.
 * @param params.onTokenApprove - Optional callback to run prior to prompting the user to sign the Token approval transaction.
 * @param params.onUserRejectedStake - Optional callback for the user rejecting to sign the Stake transaction.
 * @param params.onUserRejectedTokenApproval - Optional callback for the user rejecting to sign the Token approval transaction.
 * @param params.onUserSignedStake - Optional callback for the user signing the Stake transaction (receives the transaction hash).
 * @param params.onUserSignedTokenApproval - Optional callback for the user signing the Token approval transaction (receives the transaction hash).
 * @returns A promise that resolves when the staking process is complete, or returns early if the user rejects or a failure occurs.
 */
export const stake = async function ({
  amountInput,
  forAccount,
  hemiPublicClient,
  hemiWalletClient,
  onStake,
  onStakeConfirmed,
  onStakeFailed,
  onStakeTokenApprovalFailed,
  onStakeTokenApproved,
  onTokenApprove,
  onUserRejectedStake,
  onUserRejectedTokenApproval,
  onUserSignedStake,
  onUserSignedTokenApproval,
  t,
  token,
}: {
  forAccount: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
} & Pick<CanSubmit, 'amountInput' | 't' | 'token'> &
  StakeEvents) {
  if (!hemiWalletClient) {
    throw new Error('Hemi wallet client not initialized')
  }

  await validateStakeOperation({
    amountInput,
    forAccount,
    hemiPublicClient,
    t,
    token,
  })

  const amount = parseTokenUnits(amountInput, token)

  let stakePromise: Promise<Hash> | undefined

  if (isNativeToken(token)) {
    onStake?.()
    stakePromise = hemiWalletClient.stakeETHToken({
      amount,
      forAccount,
    })
  } else {
    const spender = stakeManagerAddresses[token.chainId]
    const tokenAddress = token.address as Address
    const tokenAllowance = await allowance(hemiPublicClient, {
      address: tokenAddress,
      owner: forAccount,
      spender,
    })

    if (tokenAllowance < amount) {
      // first, we need to approve the token to be spent by the stake manager
      onTokenApprove?.()
      const approveTxHash = await approve(hemiWalletClient, {
        address: tokenAddress,
        amount,
        spender: stakeManagerAddresses[token.chainId],
      }).catch(onUserRejectedTokenApproval)

      if (!approveTxHash) {
        return
      }
      // up to this point, the user has accepted the approval
      onUserSignedTokenApproval?.(approveTxHash)

      const approvalReceipt = await hemiPublicClient
        .waitForTransactionReceipt({
          hash: approveTxHash,
        })
        .catch(onStakeTokenApprovalFailed)

      if (!approvalReceipt) {
        return
      }

      const map: Record<TransactionReceipt['status'], () => void> = {
        reverted: () => onStakeTokenApprovalFailed?.(),
        success: () => onStakeTokenApproved?.(),
      }

      map[approvalReceipt.status]()
    }
    onStake?.()
    stakePromise = hemiWalletClient.stakeERC20Token({
      amount,
      forAccount,
      tokenAddress,
    })
  }

  const stakeTransactionHash = await stakePromise.catch(onUserRejectedStake)

  if (!stakeTransactionHash) {
    return
  }
  // up to this point, the user has signed the Transaction
  onUserSignedStake?.(stakeTransactionHash)

  const receipt = await hemiPublicClient
    .waitForTransactionReceipt({
      hash: stakeTransactionHash,
    })
    .catch(onStakeFailed)
  // if receipt is null, it's already handled on the .catch() above
  if (!receipt) {
    return
  }

  const map: Record<TransactionReceipt['status'], () => void> = {
    reverted: () => onStakeFailed?.(),
    success: () => onStakeConfirmed?.(),
  }

  map[receipt.status]()
}

const validateUnstakeOperation = async function ({
  amountInput,
  forAccount,
  hemiPublicClient,
  t,
  token,
}: {
  forAccount: Address
  hemiPublicClient: HemiPublicClient
} & Pick<CanSubmit, 'amountInput' | 't' | 'token'>) {
  if (hemiPublicClient.chain?.id !== token.chainId) {
    throw new Error(
      t('common.connect-to-network', {
        network: findChainById(token.chainId)!.name,
      }),
    )
  }

  const balance = await hemiPublicClient.stakedBalance({
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
  hemiPublicClient: HemiPublicClient
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

  const unstakeTransactionHash = await hemiWalletClient
    .unstakeToken({
      amount,
      forAccount,
      tokenAddress: getTokenAddress(token),
    })
    .catch(onUserRejectedUnstake)

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
