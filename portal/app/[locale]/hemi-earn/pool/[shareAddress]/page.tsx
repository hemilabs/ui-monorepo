import {
  fetchHemiEarnAssetConfigs,
  uniqueShareConfigs,
} from '../../_fetchers/fetchHemiEarnAssetConfigs'

import { PoolPageContent } from './_components/poolPageContent'

type Props = {
  params: Promise<{ shareAddress: string }>
}

// One static page per share OFT (dedupe configs by share). A failed registry read
// at build time throws on purpose — a broken registry should fail the build, not ship empty pages.
export async function generateStaticParams() {
  const configs = await fetchHemiEarnAssetConfigs()
  return uniqueShareConfigs(configs).map(config => ({
    shareAddress: config.share,
  }))
}

export default async function Page({ params }: Props) {
  const { shareAddress } = await params
  return <PoolPageContent shareAddress={shareAddress} />
}
