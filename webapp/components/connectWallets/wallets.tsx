import { useConnectModal } from '@rainbow-me/rainbowkit'
import { ConnectorGroup } from 'btc-wallet/connectors/types'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useConfig } from 'btc-wallet/hooks/useConfig'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import {
  ConnectedBtcAccount,
  ConnectedBtcChain,
  ConnectedEvmAccount,
  ConnectedEvmChain,
} from 'components/connectedWallet/connectedAccount'
import { ExternalLink } from 'components/externalLink'
import { Chevron } from 'components/icons/chevron'
import { useTranslations } from 'next-intl'
import { isAndroid } from 'react-device-detect'
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
  rightIcon,
  text,
}: {
  hoverClassName: string
  icon: React.ReactNode
  onClick: ReturnType<typeof useConnectModal>['openConnectModal']
  rightIcon?: React.ReactNode
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
    {rightIcon || (
      <div className="ml-auto">
        <Chevron.Right />
      </div>
    )}
  </button>
)

const InstallUnisat = function ({ connector }: { connector: ConnectorGroup }) {
  const t = useTranslations()
  return (
    <ExternalLink
      className="ml-auto rounded-full bg-black px-3 py-1 text-sm font-medium leading-normal text-white"
      href={
        // Unisat only supports chrome and android - no other browser nor mobile OS - See https://unisat.io/
        isAndroid
          ? connector.downloadUrls.android
          : connector.downloadUrls.chrome
      }
    >
      {t('common.add')}
    </ExternalLink>
  )
}

export const BtcWallet = function () {
  const { connector, status } = useBtcAccount()
  const { connect } = useConnect()
  const { connectors } = useConfig()

  const t = useTranslations('connect-wallets')

  const [unisat] = connectors

  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        hoverClassName="hover:bg-orange-950/5"
        icon={<BtcLogo />}
        onClick={() => connect(unisat.wallet)}
        rightIcon={
          !unisat.wallet.isInstalled() && <InstallUnisat connector={unisat} />
        }
        text={t('connect-btc-wallet')}
      />
    )
  }

  if (status === 'connected') {
    return (
      <Box
        description={
          <ConnectedToWallet icon={<UnisatLogo />} wallet={connector!.name} />
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
