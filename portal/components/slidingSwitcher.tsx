import { ReactNode } from 'react'

type Props = {
  first: ReactNode
  hideFirst: boolean
  second: ReactNode
}

const childContainerCss =
  'absolute inset-0 flex flex-col transition-transform duration-500'

export const SlidingSwitcher = ({ first, hideFirst, second }: Props) => (
  <div className="relative h-full overflow-x-hidden">
    <div
      className={`${childContainerCss} ${
        hideFirst ? 'invisible -translate-x-full' : 'translate-x-0'
      }`}
    >
      {first}
    </div>
    <div
      className={`${childContainerCss} ${
        hideFirst ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {second}
    </div>
  </div>
)
