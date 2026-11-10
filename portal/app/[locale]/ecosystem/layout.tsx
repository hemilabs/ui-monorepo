import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'
import { useTranslations } from 'use-intl'

export const EcosystemLayout = function () {
  const t = useTranslations()

  useDocumentTitle(`${t('ecosystem.heading')} | ${t('metadata.title')}`)

  return <Outlet />
}
