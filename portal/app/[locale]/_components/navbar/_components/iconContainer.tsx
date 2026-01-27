import { type ReactNode } from 'react'

export const IconContainer = ({
  children,
  hoverClassName = 'group-hover/item:[&_svg>path]:fill-neutral-950',
  selected = false,
  selectedClassName = '[&_svg>path]:fill-orange-600',
  size = 'size-7 md:size-5',
}: {
  children: ReactNode
  selected?: boolean
  size?: string
  selectedClassName?: string
  hoverClassName?: string
}) => (
  <div
    className={`flex ${size} items-center justify-center rounded-md transition-colors duration-300 ${
      selected
        ? selectedClassName
        : `group-hover/nav:[&_svg>path]:fill-neutral-950 ${hoverClassName}`
    }`}
  >
    {children}
  </div>
)
