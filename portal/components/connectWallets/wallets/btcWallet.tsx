import { useConnectModal } from '@rainbow-me/rainbowkit'
import { AnalyticsEvent } from 'app/analyticsEvents'
import { ConnectorGroup } from 'btc-wallet/connectors/types'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useConfig } from 'btc-wallet/hooks/useConfig'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import { useDisconnect as useBtcDisconnect } from 'btc-wallet/hooks/useDisconnect'
import {
  ConnectedBtcAccount,
  ConnectedBtcChain,
} from 'components/connectedWallet/connectedAccount'
import { ExternalLink } from 'components/externalLink'
import { FiatBalance } from 'components/fiatBalance'
import { Chevron } from 'components/icons/chevron'
import { useBitcoin } from 'hooks/useBitcoin'
import { useChainIsSupported } from 'hooks/useChainIsSupported'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { isAndroid, isIOS } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'

import { Box } from '../box'
import { BtcLogo } from '../btcLogo'
import { ConnectToSupportedChain } from '../connectToSupportedChain'
import { DisconnectWallet } from '../disconnectWallet'

const ConnectWalletButton = function ({
  event,
  hoverClassName,
  icon,
  onClick,
  rightIcon,
  text,
}: {
  event: AnalyticsEvent
  hoverClassName: string
  icon: ReactNode
  onClick: ReturnType<typeof useConnectModal>['openConnectModal']
  rightIcon?: ReactNode
  text: string
}) {
  const { track } = useUmami()
  return (
    <button
      className={`group flex w-full cursor-pointer items-center gap-x-2 
        rounded-lg bg-white p-4 shadow-sm ${hoverClassName}`}
      onClick={function () {
        track?.(event)
        onClick?.()
      }}
    >
      {icon}
      <span className="text-base font-medium text-neutral-950">{text}</span>
      {rightIcon || (
        <div className="group ml-auto">
          <Chevron.Right className="size-5 group-hover:[&>path]:fill-neutral-950" />
        </div>
      )}
    </button>
  )
}

const InstallUnisat = function ({ connector }: { connector: ConnectorGroup }) {
  const t = useTranslations()
  return (
    <ExternalLink
      className="ml-auto rounded-full bg-black px-3 py-1 text-sm font-medium text-white"
      href={
        (isAndroid && connector.downloadUrls?.android) ||
        (isIOS && connector.downloadUrls?.ios) ||
        connector.downloadUrls?.chrome
      }
    >
      {t('common.add')}
    </ExternalLink>
  )
}

export const BtcWallet = function () {
  const { chainId, status } = useBtcAccount()
  const bitcoin = useBitcoin()
  const chainSupported = useChainIsSupported(chainId)
  const { connect } = useConnect()
  const { connectors } = useConfig()
  const { disconnect } = useBtcDisconnect()

  const t = useTranslations('connect-wallets')

  const [unisat] = connectors

  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        event="btc connect"
        hoverClassName="hover:bg-connect-wallet-hovered"
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
        topContent={
          <>
            <ConnectedBtcAccount />
            <div className="flex items-center gap-1">
              <ConnectedBtcChain />
              <DisconnectWallet disconnect={disconnect} />
            </div>
          </>
        }
      >
        {chainSupported ? (
          <div className="flex items-end gap-x-1 p-2 text-4xl font-semibold text-neutral-950 md:p-4">
            <span>$</span>
            <FiatBalance token={getNativeToken(bitcoin.id)} />
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <ConnectToSupportedChain />
          </div>
        )}
      </Box>
    )
  }

  return <Skeleton className="h-16 w-full rounded-lg" />
}
