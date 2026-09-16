import { Arrow } from 'components/icons/arrow'

type Props = {
  children: string
  isUp: boolean
}

export const ChangeIndicator = ({ children, isUp }: Props) => (
  <span className="flex items-center gap-x-0.5">
    <Arrow
      aria-hidden
      className={`h-2.5 w-2 [&>path]:fill-neutral-600 ${isUp ? '' : 'rotate-180'}`}
    />
    {children}
  </span>
)
