'use client'

import { Drawer } from 'components/drawer'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type StakeOperations, type StakeToken } from 'types/stake'

import { type DrawerModes } from '../../_hooks/useDrawerStakeQueryString'

import { StakeOperation } from './stakeOperation'
import { UnstakeOperation } from './unstakeOperation'

type Props = {
  closeDrawer: () => void
  initialOperation: StakeOperations
  mode: DrawerModes
  token: StakeToken
}

export const ManageStake = function ({
  closeDrawer,
  mode,
  token,
  ...props
}: Props) {
  const isManaging = mode === 'manage' && 'initialOperation' in props

  const [operation, setOperation] = useState<StakeOperations>(() =>
    isManaging ? props.initialOperation : 'stake',
  )

  const t = useTranslations('stake-page.drawer')

  const { heading, subheading } = {
    manage: {
      heading: t('manage-your-stake'),
      subheading: t('description-manage-stake'),
    },
    stake: {
      heading: t('stake-token', { symbol: token.symbol }),
      subheading: t('stake-and-earn-rewards', { symbol: token.symbol }),
    },
  }[mode]

  const isStaking = mode === 'stake' || operation === 'stake'

  return (
    <Drawer onClose={closeDrawer}>
      {isStaking ? (
        <StakeOperation
          closeDrawer={closeDrawer}
          heading={heading}
          onOperationChange={setOperation}
          showTabs={isManaging}
          subheading={subheading}
          token={token}
        />
      ) : (
        <UnstakeOperation
          closeDrawer={closeDrawer}
          heading={heading}
          onOperationChange={setOperation}
          subheading={subheading}
          token={token}
        />
      )}
    </Drawer>
  )
}
