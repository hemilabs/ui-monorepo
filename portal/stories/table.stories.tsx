import type { Meta, StoryObj } from '@storybook/nextjs'
import { ColumnDef } from '@tanstack/react-table'
import { Table, type TableProps } from 'components/table'
import { Header } from 'components/table/_components/header'

type Row = {
  amount: string
  status: string
  votingPower: string
}

const Cell = ({ text }: { text: string }) => (
  <span className="text-sm text-neutral-950">{text}</span>
)

const columns: ColumnDef<Row>[] = [
  {
    cell: ({ row }) => <Cell text={row.original.amount} />,
    header: () => <Header text="Amount" />,
    id: 'amount',
    meta: { width: 220 },
  },
  {
    cell: ({ row }) => <Cell text={row.original.votingPower} />,
    header: () => <Header text="Voting Power" />,
    id: 'votingPower',
    meta: { width: 220 },
  },
  {
    cell: ({ row }) => <Cell text={row.original.status} />,
    header: () => <Header text="Status" />,
    id: 'status',
    meta: { width: 160 },
  },
]

const data: Row[] = [
  { amount: '1,234.56 HEMI', status: 'Active', votingPower: '1,180.3' },
  { amount: '89.50 HEMI', status: 'Active', votingPower: '72.1' },
  { amount: '12,345.00 HEMI', status: 'Unlocked', votingPower: '0' },
  { amount: '5.00 HEMI', status: 'Active', votingPower: '4.8' },
]

const meta = {
  args: {
    columns,
    data,
    loading: false,
    mode: 'static',
  },
  argTypes: {
    columns: { control: false },
    data: { control: false },
    loading: { control: 'boolean' },
    mode: { control: 'inline-radio', options: ['static', 'virtual'] },
    onRowClick: { action: 'onRowClick' },
    placeholder: { control: false },
  },
  component: Table,
  decorators: [
    Story => (
      <div className="h-96 w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
  title: 'Components/Table',
} satisfies Meta<TableProps<Row>>

export default meta

type Story = StoryObj<TableProps<Row>>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    data: [],
    placeholder: (
      <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
        No positions yet.
      </div>
    ),
  },
  parameters: {
    controls: { disable: true },
  },
}
