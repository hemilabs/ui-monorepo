import { type ComponentProps } from 'react'

import { NetworkConfigCard } from './networkConfigCard'

export const Container = ({
  className = '',
  ...props
}: ComponentProps<'div'>) => (
  <NetworkConfigCard
    className={`text-sm font-medium ${className}`}
    {...props}
  />
)
