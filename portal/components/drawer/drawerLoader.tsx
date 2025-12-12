import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'

import { Drawer } from './index'

export const DrawerLoader = ({
  className = '',
  position,
}: { className?: string } & Pick<
  ComponentProps<typeof Drawer>,
  'position'
>) => (
  <Drawer position={position}>
    <Skeleton
      className="w-full md:w-[450px]"
      containerClassName={`flex ${className ?? ''}`}
    />
  </Drawer>
)
