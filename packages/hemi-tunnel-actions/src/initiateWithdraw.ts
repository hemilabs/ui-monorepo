import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  Address,
  Chain,
  encodeFunctionData,
  PublicClient,
  WalletClient,
} from 'viem'
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { balanceOf } from 'viem-erc20/actions'

import { l2BridgeAbi } from './abis'
import { WithdrawEvents } from './types'
import { getL2BridgeAddress, validateInputs } from './utils'

const getEthBalance = ({
  account,
  publicClient,
}: {
  account: Address
  publicClient: PublicClient
}) => getBalance(publicClient, { address: account })

const canInitiateWithdraw = async function ({
  account,
  amount,
  checkBalance,
  l1Chain,
  l2Chain,
}: {
  account: Address
  amount: bigint
  checkBalance: () => Promise<string | undefined>
  l1Chain: Chain
  l2Chain: Chain
}): Promise<{
  canWithdraw: boolean
  reason?: string
}> {
  const reason = validateInputs({
    account,
    amount,
    l1Chain,
    l2Chain,
  })
  if (reason) {
    return { canWithdraw: false, reason }
  }

  const balanceReason = await checkBalance()

  if (balanceReason) {
    return { canWithdraw: false, reason: balanceReason }
  }
  return { canWithdraw: true }
}

type InitiateWithdraw = {
  account: Address
  amount: bigint
  checkBalance: () => Promise<string | undefined>
  l1Chain: Chain
  l2Chain: Chain
  l2PublicClient: PublicClient
  l2TokenAddress: Address
  l2WalletClient: WalletClient
  value?: bigint | undefined
}

const runInitiateWithdraw = ({
  account,
  amount,
  checkBalance,
  l1Chain,
  l2Chain,
  l2PublicClient,
  l2TokenAddress,
  l2WalletClient,
  value,
}: InitiateWithdraw) =>
  async function (emitter: EventEmitter<WithdrawEvents>) {
    try {
      const l2Bridge = getL2BridgeAddress({ l1Chain, l2Chain })

      const { canWithdraw, reason } = await canInitiateWithdraw({
        account,
        amount,
        checkBalance,
        l1Chain,
        l2Chain,
      }).catch(() => ({
        canWithdraw: false,
        reason: 'failed to validate inputs',
      }))

      if (!canWithdraw) {
        // reason must be defined because canWithdraw is false
        emitter.emit('withdraw-failed-validation', reason!)
        return
      }

      emitter.emit('pre-withdraw')

      const hash = await writeContract(l2WalletClient, {
        abi: l2BridgeAbi,
        account,
        address: l2Bridge,
        // See https://github.com/ethereum-optimism/ecosystem/blob/8da00d3b9044dcb58558df28bae278b613562725/packages/sdk/src/adapters/eth-bridge.ts#L178
        args: [l2TokenAddress, amount, 0, '0x'],
        chain: l2Chain,
        functionName: 'withdraw',
        value,
      }).catch(function (error) {
        emitter.emit('user-signing-withdraw-error', error)
      })

      if (!hash) {
        return
      }

      emitter.emit('user-signed-withdraw', hash)

      const withdrawalReceipt = await waitForTransactionReceipt(
        l2PublicClient,
        {
          hash,
        },
      ).catch(function (err) {
        emitter.emit('withdraw-failed', err)
      })
      if (!withdrawalReceipt) {
        return
      }

      emitter.emit(
        withdrawalReceipt.status === 'success'
          ? 'withdraw-transaction-succeeded'
          : 'withdraw-transaction-reverted',
        withdrawalReceipt,
      )
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('withdraw-settled')
    }
  }

export const encodeInitiateWithdraw = ({
  amount = BigInt(0),
  l2TokenAddress,
}: {
  amount: bigint | undefined
  l2TokenAddress: Address
}) =>
  encodeFunctionData({
    abi: l2BridgeAbi,
    // See https://github.com/ethereum-optimism/ecosystem/blob/8da00d3b9044dcb58558df28bae278b613562725/packages/sdk/src/adapters/eth-bridge.ts#L178
    args: [l2TokenAddress, amount, 0, '0x'],
    functionName: 'withdraw',
  })

export const initiateWithdrawEth = ({
  account,
  amount,
  l2PublicClient,
  ...args
}: Omit<InitiateWithdraw, 'checkBalance' | 'value'>) =>
  toPromiseEvent<WithdrawEvents>(
    runInitiateWithdraw({
      account,
      amount,
      async checkBalance() {
        const balance = await getEthBalance({
          account,
          publicClient: l2PublicClient,
        })
        // using >= because we need to consider gas fees
        if (amount >= balance) {
          return 'insufficient balance'
        }
        return undefined
      },
      l2PublicClient,
      // withdrawing ETH requires to send ETH as value, so we add it here
      value: amount,
      ...args,
    }),
  )

export const initiateWithdrawErc20 = ({
  account,
  amount,
  l2PublicClient,
  l2TokenAddress,
  ...args
}: Omit<InitiateWithdraw, 'checkBalance' | 'value'>) =>
  toPromiseEvent<WithdrawEvents>(
    runInitiateWithdraw({
      account,
      amount,
      async checkBalance() {
        const [erc20Balance, ethBalance] = await Promise.all([
          balanceOf(l2PublicClient, {
            account,
            address: l2TokenAddress,
          }),
          getEthBalance({
            account,
            publicClient: l2PublicClient,
          }),
        ])
        if (amount > erc20Balance) {
          return 'insufficient balance'
        }
        if (ethBalance === BigInt(0)) {
          return 'insufficient balance to pay for gas'
        }
        return undefined
      },
      l2PublicClient,
      l2TokenAddress,
      ...args,
    }),
  )
