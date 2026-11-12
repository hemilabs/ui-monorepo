import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'
import { useTranslations } from 'use-intl'

export const GetStartedLayout = function () {
  const t = useTranslations()

  useDocumentTitle(`${t('navbar.get-started')} | ${t('metadata.title')}`)

  return <Outlet />
}
