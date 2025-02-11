import { useTranslations } from 'next-intl'
import { type StakeOperations } from 'types/stake'

const Tab = ({
  onSelect,
  selected,
  text,
}: {
  onSelect: () => void
  selected: boolean
  text: string
}) => (
  <li
    className={`group/tab flex w-full items-center justify-center py-3 ${
      selected ? 'border-b border-solid border-b-orange-500' : ''
    }`}
  >
    <button
      className={`${
        selected
          ? 'cursor-auto text-neutral-950'
          : 'cursor-pointer text-neutral-500'
      } w-full text-xl font-medium group-hover/tab:text-neutral-950`}
      onClick={onSelect}
      type="button"
    >
      {text}
    </button>
  </li>
)

type Props = {
  onSelect: (operation: StakeOperations) => void
  selected: StakeOperations
}

export const Tabs = function ({ onSelect, selected }: Props) {
  const t = useTranslations('common')
  return (
    <ul className="flex w-full">
      <Tab
        onSelect={() => onSelect('stake')}
        selected={selected === 'stake'}
        text={t('stake')}
      />
      <Tab
        onSelect={() => onSelect('unstake')}
        selected={selected === 'unstake'}
        text={t('unstake')}
      />
    </ul>
  )
}
