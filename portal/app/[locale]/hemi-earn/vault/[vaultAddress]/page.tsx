import { getHemiEarnSupportedAssets } from 'hemi-earn-actions'

import { VaultPageContent } from './_components/vaultPageContent'

type Props = {
  params: Promise<{ vaultAddress: string }>
}

// Hemi Earn is single-chain (Hemi). Each supported entry pairs a deposit
// asset with the share token it settles to (multiple assets can map to the
// same share — e.g. the BTC variants all map to svetBTC). The Next.js route
// segment is still named `vaultAddress` (the folder is `[vaultAddress]/`)
// but the value carries the deposit asset address; `useEarnPools` filters at
// runtime so unknown addresses redirect back to /hemi-earn.
export const generateStaticParams = function () {
  const addresses = getHemiEarnSupportedAssets().map(({ asset }) => asset)
  return [...new Set(addresses)].map(asset => ({ vaultAddress: asset }))
}

export default async function Page({ params }: Props) {
  const { vaultAddress: assetAddress } = await params
  return <VaultPageContent assetAddress={assetAddress} />
}
