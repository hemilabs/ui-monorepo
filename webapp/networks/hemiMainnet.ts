import { hemi } from 'hemi-viem'
import { overrideRpcUrl } from 'networks/utils'

export const hemiMainnet = overrideRpcUrl(
  hemi,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_MAINNET,
)
