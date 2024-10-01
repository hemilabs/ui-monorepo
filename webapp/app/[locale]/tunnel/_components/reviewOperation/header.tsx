import { CloseIcon } from 'ui-common/components/closeIcon'

type Props = {
  onClose: () => void
  subtitle: string
  title: string
}

export const Header = ({ onClose, subtitle, title }: Props) => (
  <>
    <div className="flex items-center justify-between font-medium">
      <h2 className="text-2xl leading-8 text-neutral-950">{title}</h2>
      <CloseIcon
        className="cursor-pointer [&>path]:hover:stroke-neutral-950"
        onClick={onClose}
      />
    </div>
    <p className="text-ms mt-3 h-10 font-medium leading-5 text-neutral-500">
      {subtitle}
    </p>
  </>
)
