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
    <Skeleton
      className="md:w-drawer w-full"
      containerClassName={`drawer-content flex ${className ?? ''}`}
    />
  )
