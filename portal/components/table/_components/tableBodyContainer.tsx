import { ComponentProps, RefObject } from 'react'

type Props = Omit<ComponentProps<'div'>, 'className' | 'ref'> & {
  scrollRef?: RefObject<HTMLDivElement | null>
}

export const TableBodyContainer = ({
  children,
  scrollRef,
  ...props
}: Props) => (
  <div className="-mt-1.5 mb-1 min-h-0 flex-1 overflow-hidden rounded-xl bg-white shadow-md">
    <div className="size-full overflow-auto" ref={scrollRef} {...props}>
      {children}
    </div>
  </div>
)
