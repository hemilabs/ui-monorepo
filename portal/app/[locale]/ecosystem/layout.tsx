import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

export default function EcosystemLayout() {
  useDocumentTitle('Ecosystem | Hemi Portal')

  return <Outlet />
}
