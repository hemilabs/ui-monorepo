import { type ComponentProps } from 'react'

import { Header } from './header'

type Props = Omit<ComponentProps<'button'>, 'className' | 'type'> & {
  text: string
}

export const HeaderButton = ({ children, text, ...props }: Props) => (
  <button
    className="-mx-2 flex items-center gap-2 rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500"
    type="button"
    {...props}
  >
    <Header text={text} />
    {children}
  </button>
)
