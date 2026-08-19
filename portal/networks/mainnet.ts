import { updateRpcUrls } from 'networks/utils'
import { mainnet as mainnetDefinition } from 'viem/chains'

export const mainnet = updateRpcUrls(
  mainnetDefinition,
  import.meta.env.VITE_CUSTOM_RPC_URL_MAINNET,
)
