import { Button } from 'components/button'
import { QuestionMark } from 'components/icons/questionMark'

type Props = {
  isOpen: boolean
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const HelpButton = ({ isOpen, setIsOpen }: Props) => (
  <Button
    className="group/icon px-1.5"
    onClick={() => setIsOpen?.(!isOpen)}
    size="xSmall"
    type="button"
    variant="secondary"
  >
    <QuestionMark
      className={`size-4 ${
        isOpen ? '[&>path]:fill-neutral-950' : '[&>path]:fill-neutral-500'
      } 
     group-hover/icon:[&>path]:fill-neutral-950`}
    />
  </Button>
)
