import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { Suspense } from 'react'
import { useTranslations } from 'use-intl'

import {
  isDrawerMode,
  useDrawerStakeQueryString,
} from '../_hooks/useDrawerStakeQueryString'

import { ManageStake } from './manageStake'

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString, tokenAddress } =
    useDrawerStakeQueryString()
  const stakeTokens = useStakeTokens()

  if (!tokenAddress || !isDrawerMode(drawerMode)) {
    return null
  }

  const token = stakeTokens.find(t => t.address === tokenAddress)

  if (!token) {
    return null
  }

  return (
    <ManageStake
      closeDrawer={() => setDrawerQueryString(null, null)}
      token={token}
    />
  )
}

type Props = {
  children: React.ReactNode
}

const StakeLayoutClient = function ({ children }: Props) {
  const t = useTranslations()

  useDocumentTitle(`${t('navbar.boost-staking')} | ${t('metadata.title')}`)

  return (
    <>
      {children}
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}

export default StakeLayoutClient
