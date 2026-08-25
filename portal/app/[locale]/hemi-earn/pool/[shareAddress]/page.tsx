import { useParams } from 'react-router'
import { isAddress } from 'viem'

import NotFound from '../../../not-found'

import { PoolPageContent } from './_components/poolPageContent'

export default function Page() {
  const { shareAddress } = useParams()

  if (!shareAddress || !isAddress(shareAddress)) {
    return <NotFound />
  }

  return <PoolPageContent shareAddress={shareAddress} />
}
