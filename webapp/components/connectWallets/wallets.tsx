import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useConfig } from 'btc-wallet/hooks/useConfig'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import {
  ConnectedBtcAccount,
  ConnectedBtcChain,
  ConnectedEvmAccount,
  ConnectedEvmChain,
} from 'components/connectedWallet/connectedAccount'
import { Chevron } from 'components/icons/chevron'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { Box } from 'ui-common/components/box'
import { useAccount as useEvmAccount } from 'wagmi'

import { BtcLogo } from './btcLogo'
import { EthLogo } from './ethLogo'
import { MetamaskLogo } from './metamaskLogo'
import { UnisatLogo } from './unisatLogo'

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
  const { connector, status } = useBtcAccount()
  const { connect } = useConnect()
  const { connectors } = useConfig()

  const t = useTranslations('connect-wallets')

  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        hoverClassName="hover:bg-orange-950/5"
        icon={<BtcLogo />}
        onClick={() => connect(connectors[0].wallet)}
        text={t('connect-btc-wallet')}
      />
    )
  }

  if (status === 'connected') {
    return (
      <Box
        description={
          <ConnectedToWallet icon={<UnisatLogo />} wallet={connector?.name} />
        }
        title={t('btc-wallet')}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ConnectedBtcAccount />
          <ConnectedBtcChain />
        </div>
      </Box>
    )
  }

  return <Skeleton className="h-14 w-full" />
}

export const EvmWallet = function () {
  const { connector, status } = useEvmAccount()
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
