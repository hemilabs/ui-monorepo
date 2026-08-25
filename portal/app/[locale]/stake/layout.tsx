import { useDocumentTitle } from 'hooks/useDocumentTitle'

import StakeLayoutClient from './_components/stakeLayoutClient'

export default function StakeLayout(props: { children: React.ReactNode }) {
  useDocumentTitle('Stake | Hemi Portal')

  return <StakeLayoutClient {...props} />
}
