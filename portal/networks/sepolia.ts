import { updateRpcUrls } from 'networks/utils'
import { sepolia as sepoliaDefinition } from 'viem/chains'

export const sepolia = updateRpcUrls(
  sepoliaDefinition,
  import.meta.env.VITE_CUSTOM_RPC_URL_SEPOLIA,
)
