import { LinesBackground } from 'components/linesBackground'
import { type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

const Layout = ({ children }: Props) => (
  <>
    {children}
    <div className="hidden md:block">
      <LinesBackground />
    </div>
  </>
)

export default Layout
