import { ButtonIcon } from 'components/button'
import { DoubleArrow } from 'components/icons/doubleArrow'

type Props = {
  disabled: boolean
  toggle: () => void
}

export const ToggleNetwork = ({ disabled, toggle }: Props) => (
  <div className="group/icon">
    <ButtonIcon
      disabled={disabled}
      onClick={toggle}
      type="button"
      variant="secondary"
    >
      <DoubleArrow className="size-4 [&>path]:fill-neutral-500 [&>path]:transition-colors [&>path]:duration-200 group-hover/icon:[&>path]:fill-neutral-950" />
    </ButtonIcon>
  </div>
)
