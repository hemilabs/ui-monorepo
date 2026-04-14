import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'

import { Drawer } from './index'

export const DrawerLoader = ({
  className = '',
  position,
  withDrawer = true,
}: {
  className?: string
  withDrawer?: boolean
} & Pick<ComponentProps<typeof Drawer>, 'position'>) =>
  withDrawer ? (
    <Drawer position={position}>
      <Skeleton
        className="md:w-drawer w-full"
        containerClassName={`flex ${className ?? ''}`}
      />
    </Drawer>
  ) : (
    <div
      className={`drawer-content box-border flex h-[95dvh] min-h-0 flex-col md:h-full ${className}`}
    >
      <Skeleton
        className="block h-full min-h-[72dvh] w-full flex-1 md:min-h-0"
        containerClassName="flex min-h-0 w-full flex-1 flex-col"
      />
    </div>
  )

export const DrawerEmbeddedLoader = ({
  className = '',
}: {
  className?: string
}) => <DrawerLoader className={className} withDrawer={false} />
