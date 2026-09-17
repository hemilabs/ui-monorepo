import { ButtonIcon } from 'components/button'
import { Dispatch, SetStateAction } from 'react'

import { MoreItemsIcon } from '../../_icons/moreItemsIcon'

type Props = {
  // Named per row, or the table announces a column of identical unlabelled buttons.
  label: string
  isOpen: boolean
  setIsOpen?: Dispatch<SetStateAction<boolean>>
}

export const ActionButton = ({ isOpen, label, setIsOpen }: Props) => (
  <div
    className={`group/icon ${
      isOpen ? '[&>button>svg]:opacity-100 [&>button]:before:opacity-100' : ''
    }`}
  >
    <ButtonIcon
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label={label}
      onClick={() => setIsOpen?.(!isOpen)}
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
