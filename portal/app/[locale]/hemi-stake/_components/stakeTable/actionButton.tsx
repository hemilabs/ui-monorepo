import { ButtonIcon } from 'components/button'
import { type Ref } from 'react'
import { useTranslations } from 'use-intl'

import { MoreItemsIcon } from '../../_icons/moreItemsIcon'

type Props = {
  isOpen: boolean
  onClick: VoidFunction
  ref: Ref<HTMLButtonElement>
}

export function ActionButton({ isOpen, onClick, ref }: Props) {
  const t = useTranslations('hemi-stake')
  return (
    <div
      className={`group/icon [&>button:focus-visible]:ring-2 [&>button:focus-visible]:ring-neutral-500 ${
        isOpen ? '[&>button>svg]:opacity-100 [&>button]:before:opacity-100' : ''
      }`}
    >
      <ButtonIcon
        aria-expanded={isOpen}
        aria-label={t('table.position-actions')}
        onClick={onClick}
        ref={ref}
        size="xSmall"
        type="button"
        variant="tertiary"
      >
        <MoreItemsIcon
          className={`[&>path]:transition-colors [&>path]:duration-200 group-hover/icon:[&>path]:fill-neutral-950 ${
            isOpen ? '[&>path]:fill-neutral-950' : ''
          }`}
        />
      </ButtonIcon>
    </div>
  )
}
