import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

export const GetStartedLayout = function () {
  useDocumentTitle('Get Started | Hemi Portal')

  return <Outlet />
}
