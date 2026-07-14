import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { foundry } from 'viem/chains'

type JsonRpcResponse<T> = {
  error?: { message: string }
  result?: T
}

async function jsonRpc<T>({
  forkUrl,
  method,
  params,
}: {
  forkUrl: string
  method: string
  params: unknown[]
}) {
  const res = await fetch(forkUrl, {
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`RPC ${forkUrl} returned HTTP ${res.status} for ${method}`)
  }
  const json = (await res.json()) as JsonRpcResponse<T>
  if (json.error) throw new Error(`${method} failed: ${json.error.message}`)
  return json.result
}

// Chain ID is stable per fork URL, so cache it to avoid an extra roundtrip
// when setup.ts calls buildClients twice (via deployMocks + fundAccount).
const chainIdCache = new Map<string, number>()

async function fetchChainId(forkUrl: string) {
  const cached = chainIdCache.get(forkUrl)
  if (cached !== undefined) return cached
  const result = await jsonRpc<string>({
    forkUrl,
    method: 'eth_chainId',
    params: [],
  })
  if (!result) {
    throw new Error(`RPC ${forkUrl} returned no result for eth_chainId`)
  }
  const id = parseInt(result, 16)
  if (Number.isNaN(id)) {
    throw new Error(`RPC ${forkUrl} returned invalid chain id: ${result}`)
  }
  chainIdCache.set(forkUrl, id)
  return id
}

export async function buildClients({
  deployerPk,
  forkUrl,
}: {
  deployerPk: Hex
  forkUrl: string
}): Promise<{
  chain: Chain
  publicClient: PublicClient
  walletClient: WalletClient
}> {
  // Anvil keeps the forked chain's chain ID (Hemi = 43111), not foundry's 31337.
  const chainId = await fetchChainId(forkUrl)
  const chain: Chain = {
    ...foundry,
    id: chainId,
    rpcUrls: { default: { http: [forkUrl] } },
  }

  const account = privateKeyToAccount(deployerPk)
  const publicClient = createPublicClient({ chain, transport: http(forkUrl) })
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(forkUrl),
  })

  return { chain, publicClient, walletClient }
}

export async function anvilRpc({
  forkUrl,
  method,
  params,
}: {
  forkUrl: string
  method: string
  params: unknown[]
}) {
  await jsonRpc({ forkUrl, method, params })
}
