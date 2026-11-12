import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'
import { useTranslations } from 'use-intl'

import StakeLayoutClient from './_components/stakeLayoutClient'

export const StakeLayout = function () {
  const t = useTranslations()

  useDocumentTitle(`${t('navbar.boost-staking')} | ${t('metadata.title')}`)

  return (
    <StakeLayoutClient>
      <Outlet />
    </StakeLayoutClient>
  )
}
