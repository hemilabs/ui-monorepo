type Props = {
  title: string
  subtitle?: string
}

export const PageTitle = ({ subtitle, title }: Props) => (
  <div className="flex flex-col gap-y-1 sm:max-w-96 md:self-start lg:self-auto">
    <h2>{title}</h2>
    {subtitle && (
      <p className="body-text-normal text-left text-neutral-500">{subtitle}</p>
    )}
  </div>
)
