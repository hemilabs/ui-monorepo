import { getHemiEarnSupportedAssets } from 'hemi-earn-actions'

import { VaultPageContent } from './_components/vaultPageContent'

type Props = {
  params: Promise<{ vaultAddress: string }>
}

// Hemi Earn is single-chain (Hemi) and the new Router exposes multiple deposit
// assets sharing one share token. The `vaultAddress` route param maps to a
// deposit asset address. `useEarnPools` filters by the active chain at runtime
// so visiting an unknown address redirects back to /hemi-earn.
export const generateStaticParams = function () {
  const addresses = getHemiEarnSupportedAssets()
  return [...new Set(addresses)].map(vaultAddress => ({ vaultAddress }))
}

export default async function Page({ params }: Props) {
  const { vaultAddress } = await params
  return <VaultPageContent vaultAddress={vaultAddress} />
}
