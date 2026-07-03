import type { Meta, StoryObj } from '@storybook/nextjs'
import { ColumnDef } from '@tanstack/react-table'
import { Table, type TableProps } from 'components/table'
import { Header } from 'components/table/_components/header'
import { type ReactNode } from 'react'

type Row = {
  amount: string
  apr: string
  lockup: string
  rewards: string
  timeRemaining: string
  votingPower: string
}

const Centered = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-center">{children}</div>
)

const columns: ColumnDef<Row>[] = [
  {
    cell: ({ row }) => (
      <Centered>
        <span className="text-sm text-neutral-950">{row.original.amount}</span>
      </Centered>
    ),
    header: () => <Header text="Locked Amount" />,
    id: 'locked-amount',
    meta: { width: 170 },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs font-normal text-emerald-600">
          {row.original.apr}
        </span>
        <span className="text-neutral-500">{row.original.lockup}</span>
      </div>
    ),
    header: () => <Header text="Lockup" />,
    id: 'lockup',
    meta: { width: 120 },
  },
  {
    cell: ({ row }) => (
      <Centered>
        <span className="text-sm text-neutral-950">
          {row.original.votingPower}
        </span>
      </Centered>
    ),
    header: () => <Header text="Voting Power" />,
    id: 'voting-power',
    meta: { width: 150 },
  },
  {
    cell: ({ row }) => (
      <Centered>
        <span className="text-sm text-neutral-950">{row.original.rewards}</span>
      </Centered>
    ),
    header: () => <Header text="Claimable rewards" />,
    id: 'rewards',
    meta: { width: 170 },
  },
  {
    cell: ({ row }) => (
      <span className="text-sm text-neutral-950">
        {row.original.timeRemaining}
      </span>
    ),
    header: () => <Header text="Time remaining" />,
    id: 'time-remaining',
    meta: { className: 'justify-end', width: 140 },
  },
  {
    cell: () => (
      <Centered>
        <span className="text-sm text-neutral-500">···</span>
      </Centered>
    ),
    id: 'action',
    meta: { width: 60 },
  },
]

const data: Row[] = [
  {
    amount: '1,234.56 HEMI',
    apr: '12.5% APR',
    lockup: '12 months',
    rewards: '18.20 HEMI',
    timeRemaining: '284 days',
    votingPower: '1,180.3',
  },
  {
    amount: '89.50 HEMI',
    apr: '8.0% APR',
    lockup: '6 months',
    rewards: '1.05 HEMI',
    timeRemaining: '95 days',
    votingPower: '72.1',
  },
  {
    amount: '12,345.00 HEMI',
    apr: '15.0% APR',
    lockup: '24 months',
    rewards: '540.00 HEMI',
    timeRemaining: '712 days',
    votingPower: '13,600.0',
  },
  {
    amount: '5.00 HEMI',
    apr: '4.5% APR',
    lockup: '3 months',
    rewards: '0.02 HEMI',
    timeRemaining: '12 days',
    votingPower: '4.8',
  },
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
