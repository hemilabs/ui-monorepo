import { Table } from 'components/table'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

type Row = { name: string }

const rows: Row[] = [{ name: 'first' }, { name: 'second' }]

describe('Table', function () {
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
