import { ButtonIcon } from 'components/button'
import { QuestionMark } from 'components/icons/questionMark'

type Props = {
  isOpen: boolean
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const HelpButton = ({ isOpen, setIsOpen }: Props) => (
  <div className="group/icon">
    <ButtonIcon
      onClick={() => setIsOpen?.(!isOpen)}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      <QuestionMark
        className={`size-5 md:size-4 ${
          isOpen ? '[&>path]:fill-neutral-950' : '[&>path]:fill-neutral-500'
        } 
     [&>path]:transition-colors [&>path]:duration-200 group-hover/icon:[&>path]:fill-neutral-950`}
      />
    </ButtonIcon>
  </div>
)
