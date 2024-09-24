import { hemiSepolia } from 'hemi-viem'
import { overrideRpcUrl } from 'networks/utils'

export const hemiTestnet = overrideRpcUrl(
  hemiSepolia,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_SEPOLIA,
)
