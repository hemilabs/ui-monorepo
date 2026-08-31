import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ColumnDef } from '@tanstack/react-table'
import { EmptyIcon } from 'app/[locale]/staking-dashboard/_icons/emptyIcon'
import { MoreItemsIcon } from 'app/[locale]/staking-dashboard/_icons/moreItemsIcon'
import { Badge } from 'components/badge'
import { Button, ButtonIcon } from 'components/button'
import { InformationBox } from 'components/informationBox'
import { Table, type TableProps } from 'components/table'
import { Header } from 'components/table/_components/header'
import { TableCard } from 'components/table/tableCard'
import Skeleton from 'react-loading-skeleton'

type Row = {
  address: string
  apr: string
  lockedAmount: string
  lockup: string
  rewards: number
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
  <div className="inline-flex rounded-lg bg-neutral-50 p-2">
    <HemiToken className="size-6" />
  </div>
)

const RewardStack = ({ count }: { count: number }) => (
  <div className="flex flex-col items-start gap-y-0.5">
    <div className="flex -space-x-1">
      {Array.from({ length: count }).map((_, index) => (
        <div className="rounded-full ring-2 ring-white" key={index}>
          <HemiToken className="size-4" />
        </div>
      ))}
    </div>
    <span className="body-text-caption text-neutral-500">
      {`${count} Available`}
    </span>
  </div>
)

// Mirrors UnlockCta: while locked, a disabled Unlock button carries a badge with
// the time remaining; once unlockable, the plain Unlock button is shown.
const ActionCell = ({ timeRemaining }: { timeRemaining: string }) => (
  <div className="flex w-full items-center justify-end gap-x-2">
    {timeRemaining ? (
      <Button disabled size="xxSmall">
        <span className="flex items-center gap-x-1.5">
          Unlock
          <Badge>
            <span className="first-letter:uppercase">{timeRemaining}</span>
          </Badge>
        </span>
      </Button>
    ) : (
      <Button size="xxSmall">Unlock</Button>
    )}
    <div className="group/icon">
      <ButtonIcon
        aria-label="More actions"
        size="xSmall"
        type="button"
        variant="tertiary"
      >
        <MoreItemsIcon className="[&>path]:transition-colors [&>path]:duration-200 group-hover/icon:[&>path]:fill-neutral-950" />
      </ButtonIcon>
    </div>
  </div>
)

const columns: ColumnDef<Row>[] = [
  {
    cell: ({ row }) => (
      <div className="flex items-center gap-x-5">
        <TokenIcon />
        <div className="flex flex-col">
          <span className="text-neutral-950">{row.original.lockedAmount}</span>
          <span className="body-text-caption text-neutral-500">
            {row.original.address}
          </span>
        </div>
      </div>
    ),
    header: () => <Header text="Locked Amount" />,
    id: 'locked-amount',
    meta: { width: 170 },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-neutral-950">{row.original.lockup}</span>
        <span className="body-text-caption text-emerald-600">
          {row.original.apr}
        </span>
      </div>
    ),
    header: () => <Header text="Lockup" />,
    id: 'lockup',
    meta: { width: 120 },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-neutral-950">{row.original.votingPower}</span>
        <span className="body-text-caption text-neutral-500">
          {row.original.votingShare}
        </span>
      </div>
    ),
    header: () => <Header text="Voting Power" />,
    id: 'voting-power',
    meta: { width: 150 },
  },
  {
    cell: ({ row }) => <RewardStack count={row.original.rewards} />,
    header: () => <Header text="Rewards" />,
    id: 'rewards',
    meta: { width: 170 },
  },
  {
    cell: ({ row }) => (
      <ActionCell timeRemaining={row.original.timeRemaining} />
    ),
    header: () => <Header className="justify-end" text="Action" />,
    id: 'action',
    meta: { className: 'justify-end', width: 210 },
  },
]

const data: Row[] = [
  {
    address: '0xdcfe...b5f9',
    apr: '2.4% APR',
    lockedAmount: '500 HEMI',
    lockup: '4 years',
    rewards: 2,
    timeRemaining: 'In 12mo',
    votingPower: '0.096 veHEMI',
    votingShare: '50%',
  },
  {
    address: '0x8a21...4c02',
    apr: '1.8% APR',
    lockedAmount: '89.50 HEMI',
    lockup: '2 years',
    rewards: 1,
    timeRemaining: 'In 6mo',
    votingPower: '0.012 veHEMI',
    votingShare: '18%',
  },
  {
    address: '0x4f90...ab13',
    apr: '3.1% APR',
    lockedAmount: '12,345.00 HEMI',
    lockup: '4 years',
    rewards: 2,
    timeRemaining: '',
    votingPower: '2.360 veHEMI',
    votingShare: '73%',
  },
  {
    address: '0x1b7c...e5d8',
    apr: '0.9% APR',
    lockedAmount: '5.00 HEMI',
    lockup: '3 months',
    rewards: 1,
    timeRemaining: 'In 12d',
    votingPower: '0.001 veHEMI',
    votingShare: '4%',
  },
]

const meta = {
  args: {
    columns,
    // Full-width (no px-1 inset) so the card matches the Figma table, which has
    // no gutter around the header/body.
    containerClassName: 'flex h-full flex-col',
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
  // Replicates the StakeTable shell: the dashboard's `PageLayout` padding
  // (`superWide`) and the height the table occupies there.
  decorators: [
    Story => (
      <div className="w-full px-2 text-sm font-medium md:px-4 xl:px-6">
        <div className="h-[56dvh] md:min-h-136">
          <Story />
        </div>
      </div>
    ),
  ],
  title: 'Components/Table',
} satisfies Meta<TableProps<Row>>

export default meta

type Story = StoryObj<TableProps<Row>>

export const Default: Story = {}

// Mirrors the dashboard's loading state: a full-height skeleton fills the card
// while positions are fetched.
export const Loading: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <TableCard>
      <Skeleton
        className="block size-full rounded-lg"
        containerClassName="block h-full"
      />
    </TableCard>
  ),
}

// The dashboard's empty state bypasses the table entirely: no headers, just the
// full-height card with the information box centered.
export const Empty: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <TableCard>
      <InformationBox
        icon={<EmptyIcon />}
        subtitle="Get started by staking your $HEMI"
        title="No $HEMI staked"
      />
    </TableCard>
  ),
}
