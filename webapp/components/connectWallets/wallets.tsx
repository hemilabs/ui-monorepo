import { useConnectModal } from '@rainbow-me/rainbowkit'
import { ConnectorGroup } from 'btc-wallet/connectors/types'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
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
import { useBitcoin } from 'hooks/useBitcoin'
import { useChainIsSupported } from 'hooks/useChainIsSupported'
import { useTranslations } from 'next-intl'
import { isAndroid } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { getFormattedValue } from 'utils/format'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount, useBalance as useEvmBalance } from 'wagmi'

import { Balance } from './balance'
import { Box } from './box'
import { BtcLogo } from './btcLogo'
import { ConnectToSupportedChain } from './connectToSupportedChain'
import { EthLogo } from './ethLogo'

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
    <span className="text-base font-medium leading-normal text-neutral-950">
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
  const { chainId, connector, status } = useBtcAccount()
  const bitcoin = useBitcoin()
  const { balance } = useBtcBalance()
  const chainSupported = useChainIsSupported(chainId)
  const { connect } = useConnect()
  const { connectors } = useConfig()

  const t = useTranslations('connect-wallets')

  const [unisat] = connectors

  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        hoverClassName="hover:bg-orange-50 hover:border-orange-300/55"
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
      if (balance.confirmed === 0) {
        return '0'
      }
      return getFormattedValue(
        formatUnits(BigInt(balance.confirmed), bitcoin.nativeCurrency.decimals),
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
          <Balance
            balance={balance !== undefined ? getBalance() : undefined}
            symbol={bitcoin.nativeCurrency.symbol}
          />
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
        {chainSupported ? (
          <Balance
            balance={
              balance !== undefined
                ? getFormattedValue(
                    formatUnits(balance.value, balance.decimals),
                  )
                : undefined
            }
            symbol={chain.nativeCurrency.symbol}
          />
        ) : (
          <ConnectToSupportedChain />
        )}
      </Box>
    )
  }
  if (status === 'disconnected') {
    return (
      <ConnectWalletButton
        hoverClassName="hover:bg-blue-50 hover:border-blue-300/55"
        icon={<EthLogo />}
        onClick={openConnectModal}
        text={t('connect-evm-wallet')}
      />
    )
  }
  return <Skeleton className="h-14 w-full" />
}
