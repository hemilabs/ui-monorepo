import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

export default function GetStartedLayout() {
  useDocumentTitle('Get Started | Hemi Portal')

  return <Outlet />
}
