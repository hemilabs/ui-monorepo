import { updateRpcUrls } from 'networks/utils'
import { sepolia as sepoliaDefinition } from 'viem/chains'

export const sepolia = updateRpcUrls(
  sepoliaDefinition,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_SEPOLIA,
)
