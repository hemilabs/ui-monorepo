import { type ReactNode } from 'react'

export const IconContainer = ({
  children,
  selected = false,
  size = 'size-7 md:size-5',
}: {
  children: ReactNode
  selected?: boolean
  size?: string
}) => (
  <div
    className={`flex ${size} items-center justify-center rounded-md transition-colors duration-300
      ${
        selected
          ? '[&_svg>path]:fill-orange-600'
          : 'group-hover/item:[&_svg>path]:fill-neutral-950'
      }`}
  >
    {children}
  </div>
)
