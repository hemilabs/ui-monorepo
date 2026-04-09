import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'

import { Drawer } from './index'

export const DrawerLoader = ({
  className = '',
  position,
  withDrawer = true,
}: {
  className?: string
  /** Si es `false`, solo el skeleton (el `Drawer` lo envuelve el padre). Evita doble animación con `next/dynamic`. */
  withDrawer?: boolean
} & Pick<ComponentProps<typeof Drawer>, 'position'>) =>
  withDrawer ? (
    <Drawer position={position}>
      <Skeleton
        className="w-full md:w-[450px]"
        containerClassName={`flex ${className ?? ''}`}
      />
    </Drawer>
  ) : (
    <Skeleton
      className="w-full md:w-[450px]"
      containerClassName={`drawer-content flex ${className ?? ''}`}
    />
  )
