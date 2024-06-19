import { useAccountModal, useChainModal } from '@rainbow-me/rainbowkit'
import { Chevron } from 'components/icons/chevron'
import { useConnectedToUnsupportedChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTranslations } from 'next-intl'
import { formatAddress, getFormattedValue } from 'utils/format'
import { Address, formatUnits } from 'viem'
import { useAccount, useBalance } from 'wagmi'

import { EthLogo } from './ethLogo'

const ConnectedChain = ({
  icon,
  name,
  openChainSelector,
}: {
  icon: React.ReactNode
  name: string
  openChainSelector: () => void
}) => (
  <div
    className="flex h-10 w-fit cursor-pointer items-center gap-x-2 rounded-md bg-neutral-200/30 p-2"
    onClick={openChainSelector}
  >
    {icon}
    <span>{name}</span>
    <Chevron.Bottom />
  </div>
)

const ConnectedWallet = ({
  address,
  balance,
  openAddressSelector,
}: {
  address: Address
  balance: string
  openAddressSelector: () => void
}) => (
  <div className="-py-1 flex h-10 w-fit items-center rounded-lg border border-solid border-slate-600/45 bg-white pr-1 text-sm font-medium leading-normal text-slate-950">
    <span className="p-2">{balance}</span>
    <div
      className="flex cursor-pointer items-center justify-between rounded-md bg-neutral-200/65 py-1 pl-2"
      onClick={openAddressSelector}
    >
      <span>{formatAddress(address)}</span>
      <Chevron.Bottom />
    </div>
  </div>
)

export const ConnectedEvmChain = function () {
  const { chain, isConnected } = useAccount()
  const { openChainModal } = useChainModal()
  const isChainUnsupported = useConnectedToUnsupportedChain()
  const t = useTranslations('common')

  if (!isConnected) {
    return null
  }

  if (isChainUnsupported) {
    return (
      <button
        className="flex items-center gap-x-2 rounded-xl bg-red-500 px-[10px] py-2 text-base font-bold text-white shadow-md duration-150 hover:scale-105"
        onClick={openChainModal}
      >
        <span>{t('wrong-network')}</span>
        <Chevron.Bottom />
      </button>
    )
  }
  return (
    <ConnectedChain
      icon={<EthLogo />}
      name={chain.name}
      openChainSelector={openChainModal}
    />
  )
}

export const ConnectedEvmAccount = function () {
  const { address } = useAccount()
  const { openAccountModal } = useAccountModal()

  const { data: balance } = useBalance({ address })
  const formattedBalance =
    balance !== undefined
      ? `${getFormattedValue(formatUnits(balance.value, balance.decimals))} ${
          balance.symbol
        }`
      : undefined
  return (
    <ConnectedWallet
      address={address}
      balance={formattedBalance}
      openAddressSelector={openAccountModal}
    />
  )
}
