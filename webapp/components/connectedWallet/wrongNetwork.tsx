import { Chevron } from 'components/icons/chevron'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'

import { EvmChainsMenu } from './evmChainsMenu'

type NetworkType = 'BTC' | 'ETH'

export const WrongNetwork = function ({
  onClick,
  type,
}: {
  onClick: () => void
  type: NetworkType
}) {
  const t = useTranslations('common')
  return (
    <button
      className="text-ms group/wrong-network flex items-center gap-x-2 bg-transparent py-2 font-medium
        leading-5 text-rose-600 duration-150 hover:scale-105 hover:text-rose-700"
      onClick={onClick}
    >
      <span>{t('wrong-type-network', { type })}</span>
      <Chevron.Bottom className="[&>path]:fill-neutral-500 [&>path]:group-hover/wrong-network:fill-neutral-950" />
    </button>
  )
}

export const WrongEvmNetwork = function () {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)

  return (
    <div className="relative" ref={ref}>
      <WrongNetwork onClick={() => setMenuOpen(true)} type="ETH" />
      {menuOpen && <EvmChainsMenu onSwitchChain={closeMenu} />}
    </div>
  )
}
