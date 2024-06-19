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
            <span>{c.name}</span>
            <div className={chainId === c.id ? 'block' : 'invisible'}>
              <svg
                fill="none"
                height={12}
                width={12}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.375 7.547 4.5 10.125l6.125-8.25"
                  stroke="#FF6C15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
          </button>
        ),
        id: c.id.toString(),
      }))}
    />
  )
}
