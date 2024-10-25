import { ReactNode } from 'react'

type Props = {
  action: ReactNode
  icon: ReactNode
  subtitle: string
  title: string
}

export const EmptyState = ({ action, icon, subtitle, title }: Props) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-y-1">
    <div className="relative h-8 w-8 rounded-full bg-orange-50">{icon}</div>
    <h4 className="max-w-4/5 mt-1 text-center text-lg text-neutral-950">
      {title}
    </h4>
    <p className="max-w-4/5 mb-3 text-center text-neutral-500">{subtitle}</p>
    {action}
  </div>
)
