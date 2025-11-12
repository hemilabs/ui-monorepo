import { Table } from 'components/table'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemi } from 'hooks/useHemi'
import { useMemo } from 'react'

import { useGetColumns } from './columns'

export const PoolTable = function () {
  const hemi = useHemi()
  const columns = useGetColumns()

  // Normally useMemo wouldn't be used here, but react-table
  // requires data to be a stable reference.
  const data = useMemo(
    // Visually, the UI looks like a table of one row. I'm finding simpler
    // to use a table component (Plus, if we ever support other pools, it will be
    // very easy to integrate). Because of this, the "data" variable
    //  is just an array with one address: the hemiBTC pool
    () => [getBtcStakingVaultContractAddress(hemi.id)],
    [hemi.id],
  )

  return (
    <div className="mt-8 w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <Table
        columns={columns}
        data={data}
        priorityColumnIdsOnSmall={['actions']}
        smallBreakpoint={1024}
      />
    </div>
  )
}
