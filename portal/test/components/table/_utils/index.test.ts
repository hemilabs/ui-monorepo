import { type ColumnDef } from '@tanstack/react-table'
import { getNewColumnOrder } from 'components/table/_utils'
import { describe, expect, it } from 'vitest'

type TestData = {
  id: string
  name: string
  status: string
  amount: number
}

describe('getNewColumnOrder', function () {
  const mockColumns: ColumnDef<TestData>[] = [
    { header: 'Name', id: 'name' },
    { header: 'Status', id: 'status' },
    { header: 'Amount', id: 'amount' },
    { header: 'Created', id: 'created' },
    { header: 'Updated', id: 'updated' },
  ]

  it('returns correct order when width is below breakpoint with priority columns', function () {
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      priorityColumnIds: ['amount'],
      width: 500,
    })

    expect(result).toEqual(['amount', 'name', 'status', 'created', 'updated'])
  })

  it('returns undefined when priorityColumnIds is empty and width is below breakpoint', function () {
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      priorityColumnIds: [],
      width: 500,
    })

    expect(result).toBeUndefined()
  })

  it('returns undefined when priorityColumnIds is not provided and width is below breakpoint', function () {
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      width: 500,
    })

    expect(result).toBeUndefined()
  })

  it('returns undefined when width equals breakpoint and priorityColumnIds is empty', function () {
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      priorityColumnIds: [],
      width: 768,
    })

    expect(result).toBeUndefined()
  })

  it('returns undefined when width exceeds breakpoint with priority columns', function () {
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      priorityColumnIds: ['amount'],
      width: 1024,
    })

    expect(result).toBeUndefined()
  })

  it('returns undefined when width equals breakpoint with priority columns', function () {
    const breakpoint = 768
    const result = getNewColumnOrder({
      breakpoint,
      columns: mockColumns,
      priorityColumnIds: ['amount'],
      width: breakpoint,
    })

    expect(result).toBeUndefined()
  })

  it('handles all columns as priority columns when width is below breakpoint', function () {
    const reversedColumnIds = mockColumns.map(c => c.id).reverse()
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      // @ts-expect-error ids are all defined in mockColumns
      priorityColumnIds: reversedColumnIds,
      width: 500,
    })

    expect(result).toEqual(reversedColumnIds)
  })

  it('returns column order when width is exactly one pixel below breakpoint', function () {
    const result = getNewColumnOrder({
      breakpoint: 768,
      columns: mockColumns,
      priorityColumnIds: ['updated'],
      width: 767,
    })

    expect(result).toEqual(['updated', 'name', 'status', 'amount', 'created'])
  })
})
