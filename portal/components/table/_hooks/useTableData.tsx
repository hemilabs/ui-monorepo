import { getNewColumnOrder, getSafeData } from '../_utils'
import { TableProps } from '../index'

type Props<TData> = Pick<
  TableProps<TData>,
  'columns' | 'data' | 'priorityColumnIdsOnSmall'
> &
  Required<Pick<TableProps<TData>, 'smallBreakpoint'>> & {
    width: number
  }

export function useTableData<TData>({
  columns,
  data,
  priorityColumnIdsOnSmall,
  smallBreakpoint,
  width,
}: Props<TData>) {
  const safeData = getSafeData(data)

  const columnOrder = getNewColumnOrder({
    breakpoint: smallBreakpoint,
    columns,
    priorityColumnIds: priorityColumnIdsOnSmall,
    width,
  })

  return { columnOrder, safeData }
}
