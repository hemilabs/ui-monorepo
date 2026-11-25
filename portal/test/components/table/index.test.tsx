import { Table } from 'components/table'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

type Row = { name: string }

const rows: Row[] = [{ name: 'first' }, { name: 'second' }]

describe('Table', function () {
  it.each(['static', 'virtual'] as const)(
    'does not call onRowClick for a loading skeleton row in %s mode',
    async function (mode) {
      const onRowClick = vi.fn()
      const columns = [
        {
          accessorFn: (row: Row | null) => row?.name,
          header: 'Name',
          id: 'name',
        },
      ]

      const screen = await render(
        <Table
          columns={columns}
          data={[]}
          loading
          mode={mode}
          onRowClick={onRowClick}
        />,
      )
      const skeletonRow = screen.container.querySelector('tbody tr')

      if (!skeletonRow) {
        throw new Error('Expected a loading skeleton row')
      }

      skeletonRow.click()

      expect(onRowClick).not.toHaveBeenCalled()
    },
  )

  it('renders once per new data array', async function () {
    let cellRenders = 0
    const columns = [
      {
        accessorKey: 'name',
        cell({ getValue }) {
          cellRenders += 1
          return getValue()
        },
        header: 'Name',
        id: 'name',
      },
    ]
    const renderTable = () => (
      <Table columns={columns} data={[...rows]} mode="static" />
    )

    const screen = await render(renderTable())
    await expect.element(screen.getByText('second')).toBeVisible()
    const initialRenders = cellRenders

    await screen.rerender(renderTable())
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(cellRenders).toBe(initialRenders + rows.length)
  })
})
