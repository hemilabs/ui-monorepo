'use client'

import { Table } from 'components/table'
import Skeleton from 'react-loading-skeleton'

import { useEarnPools } from '../../_hooks/useEarnPools'

import { useGetPoolsColumns } from './columns'

export const PoolsTable = function () {
  const columns = useGetPoolsColumns()
  const { data: pools = [], isPending } = useEarnPools()

  if (isPending) {
    return <Skeleton className="h-17 w-full rounded-xl" />
  }

  return (
    <div className="w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <Table
        columns={columns}
        data={pools}
        mode="static"
        priorityColumnIdsOnSmall={['actions']}
      />
    </div>
  )
}
