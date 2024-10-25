import { CloseIcon } from 'ui-common/components/closeIcon'

type Props = {
  onClose: () => void
  subtitle: string
  title: string
}

export const Header = ({ onClose, subtitle, title }: Props) => (
  <>
    <div className="flex items-center justify-between font-medium">
      <h2 className="text-2xl text-neutral-950">{title}</h2>
      <CloseIcon
        className="cursor-pointer [&>path]:hover:stroke-neutral-950"
        onClick={onClose}
      />
    </div>
    <p className="mt-3 h-10 text-sm font-medium text-neutral-500">{subtitle}</p>
  </>
)
