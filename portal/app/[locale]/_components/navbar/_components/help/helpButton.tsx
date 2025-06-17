import { QuestionMark } from 'components/icons/questionMark'

type Props = {
  isOpen: boolean
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const HelpButton = ({ isOpen, setIsOpen }: Props) => (
  <div
    className={`shadow-help-icon mb-2 flex h-7 w-7 items-center justify-center
  rounded-md border border-neutral-300/55 hover:bg-neutral-50 md:mb-0
  ${isOpen ? 'bg-neutral-50' : 'bg-white'} group/icon "`}
    onClick={() => setIsOpen?.(!isOpen)}
  >
    <QuestionMark
      className={`h-4 w-4
    ${isOpen ? '[&>path]:fill-neutral-950' : '[&>path]:fill-neutral-500'} 
    group-hover/icon:[&>path]:fill-neutral-950`}
    />
  </div>
)
