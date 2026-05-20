import { Card } from 'components/card'
import Skeleton from 'react-loading-skeleton'

import { EarnedAmount } from './earnedAmount'
import { Rewards } from './rewards'
import { StakedBalance } from './stakedBalance'

const wrapperClassName =
  'flex w-full flex-col flex-wrap items-stretch justify-between gap-4 sm:flex-row md:flex-nowrap md:gap-5 [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]'

export const InfoCards = () => (
  <div className={wrapperClassName}>
    <StakedBalance />
    <EarnedAmount />
    <Rewards />
  </div>
)

// Placeholder shown by `TokensGate` while `useHemiEarnShares` is resolving.
// Mirrors `EarnCard`'s layout (label row with icon slot, then value) so the
// page doesn't reflow when the real cards mount.
const InfoCardSkeleton = () => (
  <Card shadow="sm">
    <div className="w-full p-4">
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton circle height={20} width={20} />
        </div>
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  </Card>
)

export const InfoCardsSkeleton = () => (
  <div className={wrapperClassName}>
    <InfoCardSkeleton />
    <InfoCardSkeleton />
    <InfoCardSkeleton />
  </div>
)
