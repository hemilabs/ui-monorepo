import { ToEvmWithdrawOperation } from 'types/tunnel'
import { getEvmL1PublicClient, getHemiClient } from 'utils/chainClients'
import { getWithdrawals } from 'viem/op-stack'

export const getTimeToProveInSeconds = async function (
  withdrawal: ToEvmWithdrawOperation,
): Promise<number> {
  const hemiClient = getHemiClient(withdrawal.l2ChainId)
  const publicClientL1 = getEvmL1PublicClient(withdrawal.l1ChainId)

  const receipt = await hemiClient.getTransactionReceipt({
    hash: withdrawal.transactionHash,
  })

  const { seconds } = await publicClientL1.getTimeToProve({
    receipt,
    // Chain is correctly defined, but getTimeToProve expects a more strict
    // definition of Chain.
    // @ts-expect-error This works on runtime
    targetChain: hemiClient.chain,
  })

  return seconds
}

export const getTimeToFinalizeInSeconds = async function (
  withdrawal: ToEvmWithdrawOperation,
): Promise<number> {
  const hemiClient = getHemiClient(withdrawal.l2ChainId)
  const publicClientL1 = getEvmL1PublicClient(withdrawal.l1ChainId)

  const receipt = await hemiClient.getTransactionReceipt({
    hash: withdrawal.transactionHash,
  })

  const [message] = getWithdrawals(receipt)

  const { seconds } = await publicClientL1.getTimeToFinalize({
    // @ts-expect-error Typescript doesn't recognize the type of hemiClient.chain as viem Chain
    targetChain: hemiClient.chain,
    withdrawalHash: message.withdrawalHash,
  })

  return seconds
}
