import { hemi } from 'hemi-viem'
import { updateRpcUrls } from 'networks/utils'

export const hemiMainnet = updateRpcUrls(
  hemi,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_MAINNET,
)
