import { StakeTabs } from 'components/stakeTabs'

type Props = {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => (
  <>
    <div className="mb-4 mt-5 md:hidden">
      <StakeTabs />
    </div>
    {children}
  </>
)

export default Layout
