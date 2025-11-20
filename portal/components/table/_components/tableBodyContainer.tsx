import { ComponentProps } from 'react'

export const TableBodyContainer = (
  props: Omit<ComponentProps<'div'>, 'className'>,
) => (
  <div
    className="-mt-1.5 mb-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-md"
    {...props}
  />
)
