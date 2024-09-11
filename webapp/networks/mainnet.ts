import { overrideRpcUrl } from 'utils/chain'
import { mainnet as mainnetDefinition } from 'viem/chains'

export const mainnet = overrideRpcUrl(
  mainnetDefinition,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_MAINNET,
)
