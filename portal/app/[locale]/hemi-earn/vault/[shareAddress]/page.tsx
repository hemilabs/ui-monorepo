import { useParams } from 'react-router'

import { VaultPageContent } from './_components/vaultPageContent'

export const VaultPage = function () {
  const { shareAddress } = useParams()

  return <VaultPageContent shareAddress={shareAddress!} />
}
