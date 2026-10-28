import { useParams } from 'react-router'

import { PoolPageContent } from './_components/vaultPageContent'

export const PoolPage = function () {
  const { shareAddress } = useParams()

  return <PoolPageContent shareAddress={shareAddress!} />
}
