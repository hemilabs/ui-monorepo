import { hemi } from 'hemi-viem'
import { updateRpcUrls } from 'networks/utils'

export const hemiMainnet = updateRpcUrls(
  hemi,
  import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_MAINNET,
)
