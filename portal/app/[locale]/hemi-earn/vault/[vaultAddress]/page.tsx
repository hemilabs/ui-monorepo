import { getEarnChainIds, getEarnVaultAddresses } from 'hemi-earn-actions'

import { VaultPageContent } from './_components/vaultPageContent'

type Props = {
  params: Promise<{ vaultAddress: string }>
}

// We include addresses from all chains so the static export covers all
// possible vault URLs regardless of which network the user has selected.
// Chain enforcement happens at runtime: `useEarnPools` only returns pools for
// the active chain, so navigating to a vault address that doesn't belong to
// the current chain will find no matching pool and redirect back to /hemi-earn.
export const generateStaticParams = function () {
  const addresses = getEarnChainIds().flatMap(getEarnVaultAddresses)
  return [...new Set(addresses)].map(vaultAddress => ({ vaultAddress }))
}

export default async function Page({ params }: Props) {
  const { vaultAddress } = await params
  return <VaultPageContent vaultAddress={vaultAddress} />
}
