import { HEMI_EARN_SHARES } from 'hemi-earn-actions'

import { PoolPageContent } from './_components/poolPageContent'

type Props = {
  params: Promise<{ shareAddress: string }>
}

// One static page per Vetro share OFT registered on the Router. Each page
// renders the share's deposit assets (e.g. USDC + USDT for sVUSD) and the
// share-level metrics (TVL, APY) — see `useEarnPools`
export const generateStaticParams = async () =>
  HEMI_EARN_SHARES.map(shareAddress => ({ shareAddress }))

export default async function Page({ params }: Props) {
  const { shareAddress } = await params
  return <PoolPageContent shareAddress={shareAddress} />
}
