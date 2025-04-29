import Skeleton from 'react-loading-skeleton'

import { Drawer } from './index'

export const DrawerLoader = ({ className = '' }: { className?: string }) => (
  <Drawer>
    <Skeleton
      className="w-full md:w-[450px]"
      containerClassName={`flex ${className ?? ''}`}
    />
  </Drawer>
)
