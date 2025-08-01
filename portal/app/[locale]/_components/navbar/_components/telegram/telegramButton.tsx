import { TelegramIcon } from 'components/icons/telegramIcon'

type Props = {
  isOpen: boolean
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const TelegramButton = ({ isOpen, setIsOpen }: Props) => (
  <div
    className="group/icon cursor-pointer"
    onClick={() => setIsOpen?.(!isOpen)}
  >
    <TelegramIcon
      className={`transition-colors [&_path]:hover:fill-black
      ${isOpen ? '[&>path]:fill-neutral-950' : '[&>path]:fill-neutral-500'}`}
    />
  </div>
)
