import { updateRpcUrls } from 'networks/utils'
import { mainnet as mainnetDefinition } from 'viem/chains'

export const mainnet = updateRpcUrls(
  mainnetDefinition,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_MAINNET,
)
