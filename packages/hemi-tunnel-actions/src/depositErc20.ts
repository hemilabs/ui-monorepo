import { EventEmitter } from 'events'
import {
  encodeFunctionData,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { writeContract } from 'viem/actions'
import { erc20PublicActions, erc20WalletActions } from 'viem-erc20'

import { l1StandardBridgeAbi } from './abis'
import { DepositErc20Events } from './types'
import {
  getL1StandardBridgeAddress,
  handleWaitDeposit,
  toPromiseEvent,
  validateInputs,
} from './utils'

const canDepositErc20 = async function ({
  account,
  amount,
  l1Chain,
  l1PublicClient,
  l2Chain,
  tokenAddress,
}: {
  account: Address
  amount: bigint
  l1Chain: Chain
  l1PublicClient: PublicClient
  l2Chain: Chain
  tokenAddress: Address
}): Promise<{
  canDeposit: boolean
  reason?: string
}> {
  const reason = validateInputs({
    account,
    amount,
    l1Chain,
    l2Chain,
  })
  if (reason) {
    return { canDeposit: false, reason }
  }

  const tokenBalance = await l1PublicClient
    .extend(erc20PublicActions())
    .getErc20TokenBalance({
      account,
      address: tokenAddress,
    })

  if (amount > tokenBalance) {
    return { canDeposit: false, reason: 'insufficient balance' }
  }

  return { canDeposit: true }
}

const runDepositErc20 = ({
  account,
  amount,
  approvalAmount,
  l1Chain,
  l1PublicClient,
  l1WalletClient,
  l2Chain,
  l2TokenAddress,
  l1TokenAddress,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  l1Chain: Chain
  l1PublicClient: PublicClient
  l1TokenAddress: Address
  l1WalletClient: WalletClient
  l2Chain: Chain
  l2TokenAddress: Address
}) =>
  async function (emitter: EventEmitter<DepositErc20Events>) {
    try {
      const extendedL1PublicClient = l1PublicClient.extend(erc20PublicActions())
      const extendedL1WalletClient = l1WalletClient.extend(erc20WalletActions())

      const { canDeposit, reason } = await canDepositErc20({
        account,
        amount,
        l1Chain,
        l1PublicClient,
        l2Chain,
        tokenAddress: l1TokenAddress,
      }).catch(() => ({
        canDeposit: false,
        reason: 'failed to validate inputs',
      }))

      if (!canDeposit) {
        // reason must be defined because canDeposit is false
        emitter.emit('deposit-failed-validation', reason!)
        return
      }

      const l1StandardBridge = getL1StandardBridgeAddress({ l1Chain, l2Chain })

      const allowance = await extendedL1PublicClient.getErc20TokenAllowance({
        address: l1TokenAddress,
        owner: account,
        spender: l1StandardBridge,
      })

      if (amount > allowance) {
        emitter.emit('pre-approve')
        const approveHash = await extendedL1WalletClient
          .approveErc20Token({
            address: l1TokenAddress,
            amount: approvalAmount ?? amount,
            spender: l1StandardBridge,
          })
          .catch(function (error) {
            emitter.emit('user-signing-approve-error', error)
          })

        if (!approveHash) {
          return
        }

        emitter.emit('user-signed-approve', approveHash)

        const approveReceipt = await extendedL1PublicClient
          .waitForTransactionReceipt({
            hash: approveHash,
          })
          .catch(function (error) {
            emitter.emit('approve-failed', error)
          })

        if (!approveReceipt) {
          return
        }

        emitter.emit(
          approveReceipt.status === 'success'
            ? 'approve-transaction-succeeded'
            : 'approve-transaction-reverted',
          approveReceipt,
        )
      }

      emitter.emit('pre-deposit')

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      const depositHash = await writeContract(l1WalletClient, {
        abi: l1StandardBridgeAbi,
        account,
        address: l1StandardBridge,
        // See https://github.com/ethereum-optimism/ecosystem/blob/8da00d3b9044dcb58558df28bae278b613562725/packages/sdk/src/adapters/standard-bridge.ts#L295
        args: [l1TokenAddress, l2TokenAddress, amount, 200_000, '0x'],
        chain: l1Chain,
        functionName: 'depositERC20',
      }).catch(function (error) {
        emitter.emit('user-signing-deposit-error', error)
      })

      if (!depositHash) {
        return
      }

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      await handleWaitDeposit({
        emitter,
        hash: depositHash,
        publicClient: extendedL1PublicClient,
      })
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('deposit-settled')
    }
  }

export const depositErc20 = (...args: Parameters<typeof runDepositErc20>) =>
  toPromiseEvent<DepositErc20Events>(runDepositErc20(...args))

export const encodeDepositErc20 = ({
  amount = BigInt(0),
  l1TokenAddress,
  l2TokenAddress,
}: {
  amount: bigint | undefined
  l1TokenAddress: Address
  l2TokenAddress: Address
}) =>
  encodeFunctionData({
    abi: l1StandardBridgeAbi,
    // See https://github.com/ethereum-optimism/ecosystem/blob/8da00d3b9044dcb58558df28bae278b613562725/packages/sdk/src/adapters/standard-bridge.ts#L295
    args: [l1TokenAddress, l2TokenAddress, amount, 200_000, '0x'],
    functionName: 'depositERC20',
  })
