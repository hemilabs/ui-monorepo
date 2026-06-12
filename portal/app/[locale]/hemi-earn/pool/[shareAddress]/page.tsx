import {
  fetchHemiEarnAssetConfigs,
  uniqueShareConfigs,
} from '../../_fetchers/fetchHemiEarnAssetConfigs'

import { PoolPageContent } from './_components/poolPageContent'

type Props = {
  params: Promise<{ shareAddress: string }>
}

// One static page per Vetro share OFT registered on the Router. Each page
// renders the share's deposit assets (e.g. USDC + USDT for sVUSD) and the
// share-level metrics (TVL, APY) — see `useEarnPools`. The share list is
// derived on-chain (gateways → treasuries → whitelisted tokens → Router) by
// `fetchHemiEarnAssetConfigs`; one config per asset, so dedupe by share to
// avoid generating the same page twice. A failed read at build time throws on
// purpose — a broken registry should fail the build, not ship empty pages.
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
