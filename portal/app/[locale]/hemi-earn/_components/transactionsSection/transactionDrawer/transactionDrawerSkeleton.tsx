'use client'

import { DrawerSection, DrawerTopSection } from 'components/drawer'
import Skeleton from 'react-loading-skeleton'

const StepSkeleton = () => (
  <div className="flex items-start gap-x-3 py-3">
    <Skeleton circle className="size-5" />
    <div className="flex-1">
      <Skeleton className="h-16 rounded-lg" />
    </div>
  </div>
)

export const TransactionDrawerSkeleton = ({
  onClose,
}: {
  onClose: VoidFunction
}) => (
  <div className="drawer-content h-[80dvh] md:h-full">
    <div className="mb-3 flex min-h-21 flex-col gap-y-3">
      <DrawerTopSection
        heading={<Skeleton className="h-6 w-40" />}
        onClose={onClose}
      />
      <Skeleton className="h-4 w-56" />
    </div>
    <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DrawerSection>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-4 flex flex-col gap-y-6">
          <StepSkeleton />
          <StepSkeleton />
          <StepSkeleton />
        </div>
      </DrawerSection>
    </div>
    <div className="mt-auto flex w-full justify-center border-t border-solid border-neutral-300/55 bg-neutral-50 p-6">
      <Skeleton className="h-5 w-44" />
    </div>
  </div>
)
