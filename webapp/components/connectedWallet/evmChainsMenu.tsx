import { CheckMark } from 'components/icons/checkMark'
import { Menu } from 'components/menu'
import { useAccount, useSwitchChain as useSwitchEvmChain } from 'wagmi'

import { EvmLogo } from './evmLogo'

export const EvmChainsMenu = function ({
  onSwitchChain,
}: {
  onSwitchChain: () => void
}) {
  const { chainId } = useAccount()
  const { chains, switchChain } = useSwitchEvmChain()
  return (
    <Menu
      items={chains.map(c => ({
        content: (
          <button
            className="flex items-center gap-x-2"
            disabled={chainId === c.id}
            onClick={function () {
              switchChain({ chainId: c.id })
              onSwitchChain()
            }}
          >
            <EvmLogo chainId={c.id} />
            <span className="whitespace-nowrap">{c.name}</span>
            <div className={chainId === c.id ? 'block' : 'invisible'}>
              <CheckMark />
            </div>
          </button>
        ),
        id: c.id.toString(),
      }))}
    />
  )
}
