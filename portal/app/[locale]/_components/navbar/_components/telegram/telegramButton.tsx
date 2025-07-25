import { TelegramIcon } from 'components/icons/telegramIcon'

type Props = {
  isOpen: boolean
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const TelegramButton = ({ isOpen, setIsOpen }: Props) => (
  <div
    className={`group/icon mb-2 flex h-7 w-7 items-center justify-center hover:text-black md:mb-0`}
    onClick={() => setIsOpen?.(!isOpen)}
  >
    <TelegramIcon
      className={`transition-colors
      ${isOpen ? '[&>path]:fill-neutral-950' : '[&>path]:fill-neutral-500'} 
    group-hover/icon:[&>path]:fill-neutral-950`}
    />
  </div>
)
