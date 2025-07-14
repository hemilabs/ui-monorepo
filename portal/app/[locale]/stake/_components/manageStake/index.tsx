'use client'

import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { Drawer } from 'components/drawer'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type StakeOperations, type StakeToken } from 'types/stake'
import { getTokenSymbol } from 'utils/token'

import { type DrawerModes } from '../../_hooks/useDrawerStakeQueryString'

import { StakeOperation } from './stakeOperation'
import { UnstakeOperation } from './unstakeOperation'

type Props = {
  closeDrawer: VoidFunction
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
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()

  const { heading, subheading } = {
    manage: {
      heading: t('manage-your-stake'),
      subheading: t('description-manage-stake'),
    },
    stake: {
      heading: t('stake-token', { symbol: getTokenSymbol(token) }),
      subheading: t('stake-and-earn-rewards', {
        symbol: getTokenSymbol(token),
      }),
    },
  }[mode]

  const isStaking = mode === 'stake' || operation === 'stake'

  // Prevent closing the drawer when a RainbowKit modal is open.
  // Without this check, clicks on the wallet modal (e.g., Connect Wallet)
  // are interpreted as outside clicks and trigger onClose unintentionally.
  function safeCloseDrawer() {
    if (accountModalOpen || chainModalOpen || connectModalOpen) return
    closeDrawer()
  }

  return (
    <Drawer onClose={safeCloseDrawer}>
      {isStaking ? (
        <StakeOperation
          closeDrawer={safeCloseDrawer}
          heading={heading}
          onOperationChange={setOperation}
          showTabs={isManaging}
          subheading={subheading}
          token={token}
        />
      ) : (
        <UnstakeOperation
          closeDrawer={safeCloseDrawer}
          heading={heading}
          onOperationChange={setOperation}
          subheading={subheading}
          token={token}
        />
      )}
    </Drawer>
  )
}
