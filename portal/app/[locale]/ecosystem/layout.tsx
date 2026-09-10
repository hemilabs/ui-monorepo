import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

export const EcosystemLayout = function () {
  useDocumentTitle('Ecosystem | Hemi Portal')

  return <Outlet />
}
