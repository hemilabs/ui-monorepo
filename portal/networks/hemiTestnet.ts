import { hemiSepolia } from 'hemi-viem'
import { updateRpcUrls } from 'networks/utils'

export const hemiTestnet = updateRpcUrls(
  hemiSepolia,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_SEPOLIA,
)
