import { ButtonLoader } from 'components/buttonLoader'
import dynamic from 'next/dynamic'

const ConnectEvmWallet = dynamic(
  () => import('components/connectEvmWallet').then(mod => mod.ConnectEvmWallet),
  {
    loading: ButtonLoader,
    ssr: false,
  },
)

export const DisconnectedState = () => (
  <div className="mt-5">
    <ConnectEvmWallet buttonSize="small" />
  </div>
)
