import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { hemi, hemiSepolia } from 'hemi-viem'

import { VaultPageContent } from './_components/vaultPageContent'

type Props = {
  params: Promise<{ vaultAddress: string }>
}

export const generateStaticParams = function () {
  const addresses = [
    ...getEarnVaultAddresses(hemi.id),
    ...getEarnVaultAddresses(hemiSepolia.id),
  ]
  return [...new Set(addresses)].map(vaultAddress => ({ vaultAddress }))
}

export default async function Page({ params }: Props) {
  const { vaultAddress } = await params
  return <VaultPageContent vaultAddress={vaultAddress} />
}
