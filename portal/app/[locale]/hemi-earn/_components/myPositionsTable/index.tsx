'use client'

import { Button } from 'components/button'
import { WalletIcon } from 'components/icons/walletIcon'
import { Table } from 'components/table'
import { TableEmptyState } from 'components/tableEmptyState'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEarnPositions } from '../../_hooks/useEarnPositions'
import { TotalYieldEarnedIcon } from '../../_icons/totalYieldEarnedIcon'

import { useGetPositionsColumns } from './columns'

const ConnectWalletEmptyState = function () {
  const { openDrawer } = useDrawerContext()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    openDrawer?.()
    track?.('evm connect')
  }

  return (
    <div className="flex w-full items-center justify-center py-10">
      <TableEmptyState
        action={
          <Button onClick={onClick} size="xSmall" type="button">
            {t('common.connect-wallet')}
          </Button>
        }
        icon={<WalletIcon />}
        subtitle={t('hemi-earn.table.connect-to-view-positions')}
        title={t('common.your-wallet-not-connected')}
      />
    </div>
  )
}

const NoPositionsEmptyState = function () {
  const t = useTranslations('hemi-earn.table')

  return (
    <div className="flex min-h-40 w-full flex-col items-center justify-center gap-y-2">
      <div className="flex size-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
        <TotalYieldEarnedIcon />
      </div>
      <div className="flex flex-col items-center gap-y-1 text-center">
        <p className="text-mid-md font-semibold tracking-tight text-neutral-950">
          {t('no-positions-title')}
        </p>
        <p className="text-sm text-neutral-500">{t('no-positions-subtitle')}</p>
      </div>
    </div>
  )
}

export const MyPositionsTable = function () {
  const columns = useGetPositionsColumns()
  const { data: positions = [], isPending } = useEarnPositions()
  const { status } = useAccount()

  const isConnected = walletIsConnected(status)

  if (isConnected && isPending) {
    return <Skeleton className="h-17 w-full rounded-xl" />
  }

  const placeholder = !isConnected ? (
    <ConnectWalletEmptyState />
  ) : positions.length === 0 ? (
    <NoPositionsEmptyState />
  ) : undefined

  return (
    <div className="w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <Table
        columns={columns}
        data={positions}
        mode="static"
        placeholder={placeholder}
        priorityColumnIdsOnSmall={['actions']}
      />
    </div>
  )
}
