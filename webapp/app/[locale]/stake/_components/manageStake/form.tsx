import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onSubmit: () => void
}
export const Form = ({ children, onSubmit }: Props) => (
  <form
    className="drawer-content h-[95dvh] md:h-full"
    onSubmit={function (e) {
      e.preventDefault()
      onSubmit()
    }}
  >
    {children}
  </form>
)
