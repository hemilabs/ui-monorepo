import { useConnectModal } from '@rainbow-me/rainbowkit'
import { AnalyticsEvent } from 'app/analyticsEvents'
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
import { FiatBalance } from 'components/fiatBalance'
import { Chevron } from 'components/icons/chevron'
import { useBitcoin } from 'hooks/useBitcoin'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import { useChainIsSupported } from 'hooks/useChainIsSupported'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { isAndroid, isIOS } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount, useBalance as useEvmBalance } from 'wagmi'

import { Balance } from './balance'
import { Box } from './box'
import { BtcLogo } from './btcLogo'
import { ConnectToSupportedChain } from './connectToSupportedChain'
import { EthLogo } from './ethLogo'

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
  icon: React.ReactNode
  onClick: ReturnType<typeof useConnectModal>['openConnectModal']
  rightIcon?: React.ReactNode
  text: string
}) {
  const { track } = useUmami()
  return (
    <button
      className={`group flex w-full cursor-pointer items-center gap-x-2 
        rounded-xl bg-white p-3 shadow-sm ${hoverClassName}`}
      onClick={function () {
        track?.(event)
        onClick?.()
      }}
    >
      {icon}
      <span className="text-base font-medium text-neutral-950">{text}</span>
      {rightIcon || (
        <div className="group ml-auto">
          <Chevron.Right className="group-hover:[&>path]:fill-neutral-950" />
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
  const { chainId, connector, status } = useBtcAccount()
  const bitcoin = useBitcoin()
  const { balance } = useBitcoinBalance()
  const chainSupported = useChainIsSupported(chainId)
  const { connect } = useConnect()
  const { connectors } = useConfig()

  const t = useTranslations('connect-wallets')

  const [unisat] = connectors

  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        event="btc connect"
        hoverClassName="hover:bg-orange-50"
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
    const getBalance = function () {
      if (!balance || isNaN(balance.confirmed)) {
        return undefined
      }
      return formatUnits(
        BigInt(balance.confirmed),
        bitcoin.nativeCurrency.decimals,
      )
    }

    return (
      <Box
        topContent={
          <>
            <ConnectedBtcAccount />
            <ConnectedBtcChain />
          </>
        }
        walletName={connector!.name}
        walletType={t('btc-wallet')}
      >
        {chainSupported ? (
          <Balance balance={getBalance()} token={getNativeToken(bitcoin.id)} />
        ) : (
          <ConnectToSupportedChain />
        )}
      </Box>
    )
  }

  return <Skeleton className="h-14 w-full" />
}

export const EvmWallet = function () {
  const { address, chain, chainId, connector, status } = useEvmAccount()
  const chainSupported = useChainIsSupported(chainId)
  const { data: balance } = useEvmBalance({ address })
  const { openConnectModal } = useConnectModal()
  const t = useTranslations('connect-wallets')

  if (status === 'connected') {
    return (
      <Box
        topContent={
          <>
            <ConnectedEvmAccount />
            <ConnectedEvmChain />
          </>
        }
        walletName={connector!.name}
        walletType={t('evm-wallet')}
      >
        {chainSupported && chain ? (
          <div className="flex items-end justify-between">
            <Balance
              balance={
                balance !== undefined
                  ? formatUnits(balance.value, balance.decimals)
                  : undefined
              }
              token={getNativeToken(chain.id)}
            />
            <div className="flex items-center gap-x-1 pr-2 font-normal text-neutral-500">
              <span>$</span>
              <FiatBalance token={getNativeToken(chain.id)} />
            </div>
          </div>
        ) : (
          <ConnectToSupportedChain />
        )}
      </Box>
    )
  }
  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        event="evm connect"
        hoverClassName="hover:bg-blue-50"
        icon={<EthLogo />}
        onClick={openConnectModal}
        text={t('connect-evm-wallet')}
      />
    )
  }
  return <Skeleton className="h-14 w-full" />
}
