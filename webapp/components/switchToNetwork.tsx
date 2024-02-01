import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { useNetwork, useSwitchNetwork } from 'wagmi'

type Props = {
  selectedNetwork: number
}

export const SwitchToNetwork = function ({ selectedNetwork }: Props) {
  const { chain, chains } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const isConnectedToExpectedNetwork =
    useIsConnectedToExpectedNetwork(selectedNetwork)

  const t = useTranslations('common')

  if (!chain || isConnectedToExpectedNetwork) {
    return null
  }

  const walletTargetNetwork = chains.find(c => c.id === selectedNetwork)
  const switchToNetwork = () => switchNetwork(selectedNetwork)
  return (
    <div className="flex h-9 items-center gap-x-2 rounded-xl bg-[#FF684B]/10 px-2 text-xs text-zinc-800">
      <svg
        fill="none"
        height="18"
        viewBox="0 0 19 18"
        width="19"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.5 1.5C5.36 1.5 2 4.86 2 9C2 13.14 5.36 16.5 9.5 16.5C13.64 16.5 17 13.14 17 9C17 4.86 13.64 1.5 9.5 1.5ZM9.5 9.75C9.0875 9.75 8.75 9.4125 8.75 9V6C8.75 5.5875 9.0875 5.25 9.5 5.25C9.9125 5.25 10.25 5.5875 10.25 6V9C10.25 9.4125 9.9125 9.75 9.5 9.75ZM10.25 12.75H8.75V11.25H10.25V12.75Z"
          fill="#323232"
        />
      </svg>
      <span className="font-normal">{t('wrong-network')}</span>
      <button
        className="ml-auto cursor-pointer underline"
        onClick={switchToNetwork}
        type="button"
      >
        {t('switch-to-network', { network: walletTargetNetwork.name })}
      </button>
    </div>
  )
}
