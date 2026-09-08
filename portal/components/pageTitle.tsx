const sizes = {
  normal: 'sm:max-w-96',
  wide: 'sm:max-w-3xl',
} as const

type Props = {
  size?: keyof typeof sizes
  subtitle?: string
  title: string
}

export const PageTitle = ({ size = 'normal', subtitle, title }: Props) => (
  <div
    className={`flex flex-col gap-y-1 md:self-start lg:self-auto ${sizes[size]}`}
  >
    <h2>{title}</h2>
    {subtitle && (
      <p className="body-text-normal text-left text-neutral-500">{subtitle}</p>
    )}
  </div>
)
