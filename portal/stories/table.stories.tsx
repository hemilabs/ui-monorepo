import type { Meta, StoryObj } from '@storybook/nextjs'
import { type ColumnDef } from '@tanstack/react-table'
import { ButtonIcon } from 'components/button'
import { Table, type TableProps } from 'components/table'
import { Header } from 'components/table/_components/header'

type Row = {
  address: string
  apy: string
  lockedAmount: string
  lockup: string
  rewardsCount: string
  timeRemaining: string
  votingPower: string
  votingShare: string
}

const HemiToken = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20">
    <rect fill="#FF6C15" height={20} rx={10} width={20} />
    <path
      d="M11.2016 3.7519C11.1372 3.74034 11.0767 3.78272 11.0653 3.84823L10.2895 8.3296H9.71049L8.93468 3.84823C8.92333 3.78272 8.86277 3.74034 8.79844 3.7519C6.04337 4.29521 3.93165 6.68425 3.75757 9.60504C3.75757 9.60889 3.75 9.7322 3.75 9.79385C3.75 9.80156 3.75 9.80926 3.75 9.81312C3.75 9.83624 3.75 9.85935 3.75 9.88247C3.75 9.89018 3.75 9.89789 3.75 9.90945C3.75 9.94027 3.75 9.96725 3.75 9.99807C3.75 13.0961 5.92227 15.674 8.80222 16.2442C8.86656 16.2558 8.92711 16.2134 8.93846 16.1479L9.71427 11.6665H10.2933L11.0653 16.1518C11.0767 16.2173 11.1372 16.2597 11.2016 16.2481C13.9566 15.7009 16.0646 13.3119 16.2424 10.3911C16.2424 10.3873 16.25 10.2639 16.25 10.2023C16.25 10.1946 16.25 10.1869 16.25 10.183C16.25 10.1599 16.25 10.1368 16.25 10.1137C16.25 10.106 16.25 10.0983 16.25 10.0867C16.25 10.0559 16.25 10.0289 16.25 9.99807C16.2538 6.90003 14.0815 4.32218 11.2016 3.7519Z"
      fill="white"
    />
  </svg>
)

const TokenIcon = () => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 p-2">
    <HemiToken className="size-5" />
  </div>
)

const RewardStack = () => (
  <div className="flex items-center">
    <HemiToken className="size-4" />
    <div className="-ml-1.5 flex rounded-full border border-white">
      <HemiToken className="size-4" />
    </div>
  </div>
)

const EllipsisIcon = () => (
  <svg
    aria-hidden="true"
    className="text-neutral-500"
    fill="currentColor"
    focusable={false}
    height={16}
    viewBox="0 0 16 16"
    width={16}
  >
    <circle cx={4} cy={8} r={1.25} />
    <circle cx={8} cy={8} r={1.25} />
    <circle cx={12} cy={8} r={1.25} />
  </svg>
)

const ActionCell = ({ timeRemaining }: { timeRemaining: string }) => (
  <div className="flex w-full items-center justify-end gap-x-2">
    <button
      className="flex h-6 items-center gap-x-1 rounded-md bg-orange-600 px-2.5"
      type="button"
    >
      <span className="text-xs font-semibold text-white">Unlock</span>
      <span className="flex h-4 items-center rounded-md bg-orange-100 px-1.5 text-xxs font-medium text-orange-600">
        {timeRemaining}
      </span>
    </button>
    <ButtonIcon
      aria-label="More actions"
      size="xxSmall"
      type="button"
      variant="secondary"
    >
      <EllipsisIcon />
    </ButtonIcon>
  </div>
)

const columns: ColumnDef<Row>[] = [
  {
    cell: ({ row }) => (
      <div className="flex items-center gap-x-3">
        <TokenIcon />
        <div className="flex flex-col">
          <span className="text-neutral-950">{row.original.lockedAmount}</span>
          <span className="text-xxs text-neutral-500">
            {row.original.address}
          </span>
        </div>
      </div>
    ),
    header: () => <Header text="Locked Amount" />,
    id: 'locked-amount',
    meta: { width: 180 },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-neutral-950">{row.original.lockup}</span>
        <span className="text-xxs text-emerald-600">{row.original.apy}</span>
      </div>
    ),
    header: () => <Header text="Lockup" />,
    id: 'lockup',
    meta: { width: 100 },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-neutral-950">{row.original.votingPower}</span>
        <span className="text-xxs text-neutral-500">
          {row.original.votingShare}
        </span>
      </div>
    ),
    header: () => <Header text="Voting Power" />,
    id: 'voting-power',
    meta: { width: 130 },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-0.5">
        <RewardStack />
        <span className="text-xxs text-neutral-500">
          {row.original.rewardsCount}
        </span>
      </div>
    ),
    header: () => <Header text="Rewards" />,
    id: 'rewards',
    meta: { width: 120 },
  },
  {
    cell: ({ row }) => (
      <ActionCell timeRemaining={row.original.timeRemaining} />
    ),
    header: () => <Header className="justify-end" text="Action" />,
    id: 'action',
    meta: { className: 'justify-end', width: 180 },
  },
]

const data: Row[] = [
  {
    address: '0xdcfe...b5f9',
    apy: '2.4% APY',
    lockedAmount: '500 HEMI',
    lockup: '4 years',
    rewardsCount: '2 Available',
    timeRemaining: 'In 12mo',
    votingPower: '0.096 veHEMI',
    votingShare: '50%',
  },
  {
    address: '0x8a21...4c02',
    apy: '1.8% APY',
    lockedAmount: '89.50 HEMI',
    lockup: '2 years',
    rewardsCount: '1 Available',
    timeRemaining: 'In 6mo',
    votingPower: '0.012 veHEMI',
    votingShare: '18%',
  },
  {
    address: '0x4f90...ab13',
    apy: '3.1% APY',
    lockedAmount: '12,345.00 HEMI',
    lockup: '4 years',
    rewardsCount: '2 Available',
    timeRemaining: 'In 24mo',
    votingPower: '2.360 veHEMI',
    votingShare: '73%',
  },
  {
    address: '0x1b7c...e5d8',
    apy: '0.9% APY',
    lockedAmount: '5.00 HEMI',
    lockup: '3 months',
    rewardsCount: '1 Available',
    timeRemaining: 'In 12d',
    votingPower: '0.001 veHEMI',
    votingShare: '4%',
  },
]

const meta = {
  args: {
    columns,
    data,
    loading: false,
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
      <div className="h-96 w-full max-w-3xl text-sm font-medium">
        <Story />
      </div>
    ),
  ],
  title: 'Components/Table',
} satisfies Meta<TableProps<Row>>

export default meta

type Story = StoryObj<TableProps<Row>>

export const Default: Story = {}

export const Loading: Story = {
  args: {
    data: [],
    loading: true,
  },
  parameters: {
    controls: { disable: true },
  },
}

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
