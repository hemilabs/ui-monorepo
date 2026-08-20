import { hemiSepolia } from 'hemi-viem'
import { updateRpcUrls } from 'networks/utils'

export const hemiTestnet = updateRpcUrls(
  hemiSepolia,
  import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_SEPOLIA,
)
