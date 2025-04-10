import { EventEmitter } from 'events'
import {
  encodeFunctionData,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { writeContract } from 'viem/actions'

import { l1StandardBridgeAbi } from './abis'
import { DepositEvents } from './types'
import {
  getL1StandardBridgeAddress,
  handleWaitDeposit,
  toPromiseEvent,
  validateInputs,
} from './utils'

const canDepositEth = async function ({
  account,
  amount,
  l1Chain,
  l1PublicClient,
  l2Chain,
}: {
  account: Address
  amount: bigint
  l1Chain: Chain
  l1PublicClient: PublicClient
  l2Chain: Chain
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

  const balance = await l1PublicClient.getBalance({ address: account })
  if (amount >= balance) {
    return { canDeposit: false, reason: 'insufficient balance' }
  }

  return { canDeposit: true }
}

const runDepositEth = ({
  account,
  amount,
  l1Chain,
  l1PublicClient,
  l1WalletClient,
  l2Chain,
}: {
  account: Address
  amount: bigint
  l1Chain: Chain
  l1PublicClient: PublicClient
  l1WalletClient: WalletClient
  l2Chain: Chain
}) =>
  async function (emitter: EventEmitter<DepositEvents>) {
    try {
      const { canDeposit, reason } = await canDepositEth({
        account,
        amount,
        l1Chain,
        l1PublicClient,
        l2Chain,
      }).catch(() => ({
        canDeposit: false,
        reason: 'failed to validate inputs',
      }))

      if (!canDeposit) {
        // reason must be defined because canDeposit is false
        emitter.emit('deposit-failed-validation', reason!)
        return
      }

      emitter.emit('pre-deposit')

      const l1StandardBridge = getL1StandardBridgeAddress({ l1Chain, l2Chain })

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      const depositHash = await writeContract(l1WalletClient, {
        abi: l1StandardBridgeAbi,
        account,
        address: l1StandardBridge,
        // See https://github.com/ethereum-optimism/ecosystem/blob/8da00d3b9044dcb58558df28bae278b613562725/packages/sdk/src/adapters/eth-bridge.ts#L144
        args: [200_000, '0x'],
        chain: l1Chain,
        functionName: 'depositETH',
        value: amount,
      }).catch(function (error) {
        emitter.emit('user-signing-deposit-error', error)
      })

      if (!depositHash) {
        return
      }

      await handleWaitDeposit({
        emitter,
        hash: depositHash,
        publicClient: l1PublicClient,
      })
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('deposit-settled')
    }
  }

export const depositEth = (...args: Parameters<typeof runDepositEth>) =>
  toPromiseEvent<DepositEvents>(runDepositEth(...args))

export const encodeDepositEth = () =>
  // Depositing ETH does not depend on the amount sent, it costs always the same!
  encodeFunctionData({
    abi: l1StandardBridgeAbi,
    // See https://github.com/ethereum-optimism/ecosystem/blob/8da00d3b9044dcb58558df28bae278b613562725/packages/sdk/src/adapters/eth-bridge.ts#L144
    args: [200_000, '0x'],
    functionName: 'depositETH',
  })
