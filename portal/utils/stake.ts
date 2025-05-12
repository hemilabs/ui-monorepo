import hemilabsTokenList from '@hemilabs/token-list'
import { stakeManagerAddresses } from 'hemi-viem-stake-actions'
import {
  type HemiPublicClient,
  type HemiWalletClient,
} from 'hooks/useHemiClient'
import { NetworkType } from 'hooks/useNetworkType'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { type Address, type Chain, type Hash } from 'viem'

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

const validateStakeOperation = async function ({
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
  const balance = isNativeToken(token)
    ? await hemiPublicClient.getBalance({
        address: forAccount,
      })
    : await hemiPublicClient.getErc20TokenBalance({
        account: forAccount,
        // @ts-expect-error token is not native, so token.address is address
        address: token.address,
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
 * @param params All the parameters needed to determine if a user can stake a token
 * @param params.amount The amount of tokens to stake
 * @param params.forAccount The address of the user that will stake
 * @param params.hemiPublicClient Hemi public client for read-only calls
 * @param params.hemiWalletClient Hemi Wallet client for signing transactions
 * @param params.onStake Optional callback to run prior to prompt the user to sign a Stake transaction
 * @param params.onStakeConfirmed Optional callback for the Stake transaction confirmation
 * @param params.onStakeFailed Optional callback for the Stake transaction failure
 * @param params.onStakeTokenApprovalFailed Optional callback for the Token approval transaction failure
 * @param params.onStakeTokenApproved Optional callback after the token is approved
 * @param params.onTokenApprove Optional callback to run prior to prompt the user to sign the Token approval transaction
 * @param params.onUserRejectedStake Optional callback for the user rejecting to sign the Stake transaction
 * @param params.onUserRejectedTokenApproval Optional callback for the user rejecting to sign the Token approval transaction
 * @param params.onUserSignedStake Optional callback for the user signing the Stake transaction
 * @param params.onUserSignedTokenApproval Optional callback for the user signing the Token approval transaction
 * @param params.token The token to stake
 */
export const stake = async function ({
  amount,
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
  token,
}: {
  amount: bigint
  forAccount: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
  token: EvmToken
} & StakeEvents) {
  await validateStakeOperation({
    amount,
    forAccount,
    hemiPublicClient,
    token,
  })

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
    const allowance = await hemiPublicClient.getErc20TokenAllowance({
      address: tokenAddress,
      owner: forAccount,
      spender,
    })

    if (allowance < amount) {
      // first, we need to approve the token to be spent by the stake manager
      onTokenApprove?.()
      const approveTxHash = await hemiWalletClient
        .approveErc20Token({
          address: tokenAddress,
          amount,
          spender: stakeManagerAddresses[token.chainId],
        })
        .catch(onUserRejectedTokenApproval)

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

      if (approvalReceipt.status === 'success') {
        onStakeTokenApproved?.()
      } else {
        onStakeTokenApprovalFailed?.()
      }
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

  if (receipt.status === 'success') {
    onStakeConfirmed?.()
  } else {
    onStakeFailed?.()
  }
}

const validateUnstakeOperation = async function ({
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
  const balance = await hemiPublicClient.stakedBalance({
    address: forAccount,
    tokenAddress: getTokenAddress(token),
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

type UnstakeEvents = Partial<{
  onUnstake: () => void
  onUnstakeConfirmed: () => void
  onUnstakeFailed: () => void
  onUserRejectedUnstake: () => void
  onUserSignedUnstake: (hash: Hash) => void
}>

/**
 * Unstakes an amount of a token in Hemi.
 * @param params All the parameters needed to determine if a user can unstake a token
 * @param params.amount The amount of tokens to stake
 * @param params.forAccount The address of the user that will unstake
 * @param params.hemiPublicClient Hemi public client for read-only calls
 * @param params.hemiWalletClient Hemi Wallet client for signing transactions
 * @param params.onUnstake Optional callback to run prior to prompt the user to sign a Unstake transaction
 * @param params.onUnstakeConfirmed Optional callback for the Unstake transaction confirmation
 * @param params.onUnstakeFailed Optional callback for the Unstake transaction failure
 * @param params.onUserRejectedUnstake Optional callback for the user rejecting to sign the Unstake transaction
 * @param params.onUserSignedUnstake Optional callback for the user signing the Unstake transaction
 * @param params.token The token to stake
 */
export const unstake = async function ({
  amount,
  forAccount,
  hemiPublicClient,
  hemiWalletClient,
  onUnstake,
  onUnstakeConfirmed,
  onUnstakeFailed,
  onUserRejectedUnstake,
  onUserSignedUnstake,
  token,
}: {
  amount: bigint
  forAccount: Address
  hemiPublicClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
  token: EvmToken
} & UnstakeEvents) {
  await validateUnstakeOperation({
    amount,
    forAccount,
    hemiPublicClient,
    token,
  })

  onUnstake?.()

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
