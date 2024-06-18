import { Chevron } from 'components/icons/chevron'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'

import { EvmChainsMenu } from './evmChainsMenu'

export const WrongNetwork = function ({ onClick }: { onClick: () => void }) {
  const t = useTranslations('common')
  return (
    <button
      className="flex items-center gap-x-2 rounded-xl bg-red-500 px-[10px] py-2 text-base font-bold text-white shadow-md duration-150 hover:scale-105"
      onClick={onClick}
    >
      <span>{t('wrong-network')}</span>
      <Chevron.Bottom />
    </button>
  )
}

export const WrongEvmNetwork = function () {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)

  return (
    <div className="relative" ref={ref}>
      <WrongNetwork onClick={() => setMenuOpen(true)} />
      {menuOpen && <EvmChainsMenu onSwitchChain={closeMenu} />}
    </div>
  )
}
