import { bitcoinMainnet, bitcoinTestnet } from 'btc-wallet/chains'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { type Account } from 'btc-wallet/unisat'
import { BtcWalletLogo } from 'components/connectWallets/btcWalletLogo'
import { EvmWalletLogo } from 'components/connectWallets/evmWalletLogo'
import { ProfileIcon } from 'components/connectWallets/icons/profile'
import { CopyButton } from 'components/copyButton'
import { useConnectedToUnsupportedBtcChain } from 'hooks/useConnectedToUnsupportedChain'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { ReactNode } from 'react'
import { formatBtcAddress, formatEvmAddress } from 'utils/format'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { BtcLogo } from '../icons/btcLogo'

import { WrongNetwork } from './wrongNetwork'

const ConnectedChain = function ({
  icon,
  name,
}: {
  icon: ReactNode
  name: string
}) {
  const [networkType] = useNetworkType()
  const isMainnet = networkType === 'mainnet'

  return (
    <div className="flex items-center gap-3 px-2">
      <div
        className={`${
          isMainnet ? 'w-32' : 'w-37'
        } relative flex h-7 items-center gap-x-2 rounded-md px-2 py-1.5 shadow-sm transition-colors duration-200 hover:bg-neutral-50`}
      >
        <div className="flex w-full cursor-pointer items-center justify-between gap-x-2 rounded-md">
          <div className="flex items-center gap-x-1">
            {icon}
            <span className="text-sm font-medium text-neutral-950">{name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ConnectedWallet = function ({
  address,
  connectorLogo,
  connectorName,
  copyEvent,
  formattedAddress,
}: {
  address: Address | Account | undefined
  connectorLogo: ReactNode | undefined
  connectorName: string | undefined
  copyEvent: 'btc copy' | 'evm copy'
  formattedAddress: string
}) {
  const { track } = useUmami()

  return (
    <div className="group/connected-wallet relative flex h-8 items-center rounded-lg py-2 text-sm font-medium text-neutral-950">
      <div className="flex items-center gap-3">
        <div className="relative size-8">
          <ProfileIcon />
          {connectorName && (
            <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-neutral-100 p-0.5">
              {connectorLogo}
            </div>
          )}
        </div>

        <div className="flex items-center gap-x-1">
          <span className="text-sm">{formattedAddress}</span>
          {address && (
            <CopyButton
              onCopy={() => track?.(copyEvent, { wallet: connectorName! })}
              text={address}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export const ConnectedEvmAccount = function () {
  const { address, connector } = useAccount()

  return (
    <ConnectedWallet
      address={address}
      connectorLogo={
        <EvmWalletLogo className="size-4" walletName={connector?.name} />
      }
      connectorName={connector?.name}
      copyEvent="evm copy"
      formattedAddress={address ? formatEvmAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcAccount = function () {
  const { address, connector } = useBtcAccount()

  return (
    <ConnectedWallet
      address={address}
      connectorLogo={
        <BtcWalletLogo className="size-4" walletId={connector?.id} />
      }
      connectorName={connector?.name}
      copyEvent="btc copy"
      formattedAddress={address ? formatBtcAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcChain = function () {
  const { chain, connector, isConnected } = useBtcAccount()
  const [networkType] = useNetworkType()

  const { switchChain } = useSwitchBtcChain()

  const isChainUnsupported = useConnectedToUnsupportedBtcChain()

  if (!isConnected) {
    return null
  }

  if (isChainUnsupported || !chain) {
    // As only one btc chain is supported at the moment, this will work.
    // Once there are multiple chains, we may need to show a dropdown or something
    // to select the chain to connect to.
    const btcChain = networkType === 'mainnet' ? bitcoinMainnet : bitcoinTestnet
    return (
      <WrongNetwork
        onClick={
          connector?.supportsSwitchNetwork
            ? () => switchChain({ chainId: btcChain.id })
            : undefined
        }
        type="BTC"
      />
    )
  }
  return <ConnectedChain icon={<BtcLogo />} name={chain.name} />
}
