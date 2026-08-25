import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { PropsWithChildren } from 'react'

export default function GetStartedLayout({ children }: PropsWithChildren) {
  useDocumentTitle('Get Started | Hemi Portal')

  return <>{children}</>
}
