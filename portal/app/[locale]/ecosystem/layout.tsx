import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { PropsWithChildren } from 'react'

export default function EcosystemLayout({ children }: PropsWithChildren) {
  useDocumentTitle('Ecosystem | Hemi Portal')

  return <>{children}</>
}
