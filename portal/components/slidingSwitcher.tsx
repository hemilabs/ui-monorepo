import { ReactNode } from 'react'

type Props = {
  first: ReactNode
  second: ReactNode
  showFirst: boolean
}

const childContainerCss =
  'absolute inset-0 flex flex-col transition-transform duration-500'

export const SlidingSwitcher = ({ first, second, showFirst }: Props) => (
  <div className="relative h-full overflow-x-hidden">
    <div
      className={`${childContainerCss} ${
        showFirst ? 'invisible -translate-x-full' : 'translate-x-0'
      }`}
    >
      {first}
    </div>
    <div
      className={`${childContainerCss} ${
        showFirst ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {second}
    </div>
  </div>
)
