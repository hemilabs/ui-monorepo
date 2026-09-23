import { Chevron } from 'components/icons/chevron'
import { useTranslations } from 'use-intl'

type NetworkType = 'BTC' | 'ETH'

export const WrongNetwork = function ({
  onClick,
  type,
}: {
  onClick?: VoidFunction
  type: NetworkType
}) {
  const t = useTranslations('common')

  if (!onClick) {
    return (
      <div className="flex items-center p-2 text-sm font-medium text-rose-600">
        <span>{t('wrong-type-network', { type })}</span>
      </div>
    )
  }

  return (
    <button
      className="group/wrong-network flex items-center gap-x-2 bg-transparent p-2 text-sm font-medium text-rose-600 duration-150 hover:scale-105 hover:text-rose-700"
      onClick={onClick}
    >
      <span>{t('wrong-type-network', { type })}</span>
      <Chevron.Bottom className="[&>path]:fill-neutral-500 [&>path]:group-hover/wrong-network:fill-neutral-950" />
    </button>
  )
}
