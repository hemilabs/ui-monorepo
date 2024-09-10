import { TunnelTabs } from 'components/tunnelTabs'

type Props = {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => (
  <>
    {/* only visible in mobile, for larger viewports check header.tsx */}
    <div className="mt-5 md:hidden">
      <TunnelTabs />
    </div>
    {children}
  </>
)

export default Layout
