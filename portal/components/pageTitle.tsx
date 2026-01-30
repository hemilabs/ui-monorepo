type Props = {
  title: string
  subtitle?: string
}

export const PageTitle = ({ subtitle, title }: Props) => (
  <div className="flex flex-col gap-y-1">
    <h2 className="font-medium">{title}</h2>
    {subtitle && <p className="font-medium text-neutral-600">{subtitle}</p>}
  </div>
)
