import { hemi } from 'hemi-viem'
import {
  createPublicClient,
  createTestClient,
  type EIP1193RequestFn,
  http,
  toHex,
  type Transport,
} from 'viem'
import { getBlock, increaseTime, mine } from 'viem/actions'

export const anvilPort = 8547
export const anvilUrl = `http://127.0.0.1:${anvilPort}`

export const createHemiClient = () =>
  createPublicClient({ chain: hemi, transport: http(anvilUrl) })

export const createAnvilTestClient = () =>
  createTestClient({ chain: hemi, mode: 'anvil', transport: http(anvilUrl) })

export const advanceChainTime = async function (seconds: number) {
  const client = createAnvilTestClient()
  await increaseTime(client, { seconds })
  await mine(client, { blocks: 1 })
  const { timestamp } = await getBlock(client)
  return timestamp
}

// Anvil's gas estimate for veHEMI's createLock comes out below what the
// delegate() call inside it needs, so an unpadded limit reverts out of gas.
// Wallets pad their estimates, and so does this one, also when anvil signs.
const padGas = (estimate: unknown) =>
  toHex(BigInt(estimate as string) * BigInt(2))

export const walletTransport: Transport = function (params) {
  const transport = http(anvilUrl)(params)
  const request = async function ({
    method,
    params: requestParams,
  }: Parameters<EIP1193RequestFn>[0]) {
    if (method === 'eth_sendTransaction') {
      const [tx] = requestParams as [{ gas?: string }]
      if (tx.gas === undefined) {
        const estimate = await transport.request({
          method: 'eth_estimateGas',
          params: [tx],
        })
        return transport.request({
          method,
          params: [{ ...tx, gas: padGas(estimate) }],
        })
      }
    }
    const result = await transport.request({ method, params: requestParams })
    return method === 'eth_estimateGas' ? padGas(result) : result
  }
  return { ...transport, request: request as EIP1193RequestFn }
}
