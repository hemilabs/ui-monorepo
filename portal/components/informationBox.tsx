import { ReactNode } from 'react'

type Props = {
  actions?: ReactNode
  icon: ReactNode
  subtitle: string
  title: string
}

export const InformationBox = ({ actions, icon, subtitle, title }: Props) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-y-4">
    <div className="flex flex-col items-center gap-y-3">
      <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-orange-50">
        {icon}
      </div>
      <div className="max-w-4/5 flex flex-col items-center text-center">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-sm text-neutral-500">{subtitle}</p>
      </div>
    </div>
    {actions ? <div className="flex gap-x-3">{actions}</div> : null}
  </div>
)
