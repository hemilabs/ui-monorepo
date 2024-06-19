import { useConnectModal } from '@rainbow-me/rainbowkit'
import {
  ConnectedEvmAccount,
  ConnectedEvmChain,
} from 'components/connectedWallet/connectedAccount'
import { Chevron } from 'components/icons/chevron'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { Box } from 'ui-common/components/box'
import { useAccount } from 'wagmi'

import { BtcLogo } from './btcLogo'
import { EthLogo } from './ethLogo'
import { MetamaskLogo } from './metamaskLogo'

const ConnectedToWallet = function ({
  icon,
  wallet,
}: {
  icon: React.ReactNode
  wallet: string
}) {
  const t = useTranslations('connect-wallets')
  return (
    <div className="flex items-center gap-x-2">
      {icon}
      <span className="text-sm font-medium text-slate-600">
        {t('connected-with-wallet', { wallet })}
      </span>
    </div>
  )
}

const ConnectWalletButton = ({
  hoverClassName,
  icon,
  onClick,
  text,
}: {
  hoverClassName: string
  icon: React.ReactNode
  onClick: () => void
  text: string
}) => (
  <button
    className={`group flex w-full cursor-pointer items-center gap-x-2 rounded-xl border
       border-solid border-slate-200 bg-white p-3 shadow-sm ${hoverClassName}`}
    onClick={onClick}
  >
    {icon}
    <span className="text-base font-medium leading-normal text-slate-950">
      {text}
    </span>
    <div className="ml-auto">
      <Chevron.Right />
    </div>
  </button>
)

export const BtcWallet = function () {
  const t = useTranslations('connect-wallets')
  return (
    <ConnectWalletButton
      hoverClassName="hover:bg-orange-950/5"
      icon={<BtcLogo />}
      // TODO enable btc wallet https://github.com/BVM-priv/ui-monorepo/issues/339
      // eslint-disable-next-line arrow-body-style
      onClick={() => {}}
      text={t('connect-btc-wallet')}
    />
  )
}

export const EvmWallet = function () {
  const { connector, status } = useAccount()
  const { openConnectModal } = useConnectModal()
  const t = useTranslations('connect-wallets')

  if (status === 'connected') {
    return (
      <Box
        description={
          <ConnectedToWallet icon={<MetamaskLogo />} wallet={connector.name} />
        }
        title={t('evm-wallet')}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ConnectedEvmAccount />
          <ConnectedEvmChain />
        </div>
      </Box>
    )
  }
  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        hoverClassName="hover:bg-indigo-400/5"
        icon={<EthLogo />}
        onClick={openConnectModal}
        text={t('connect-evm-wallet')}
      />
    )
  }
  return <Skeleton className="h-14 w-full" />
}
