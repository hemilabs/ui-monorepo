type CardProps = {
  children: React.ReactNode
  className?: string
  customPadding?: boolean
}
export const Card = ({
  children,
  className,
  customPadding = false,
}: CardProps) => (
  <div
    className={`${className} flex flex-col rounded-2xl bg-white ${
      customPadding ? '' : 'px-6 pb-4 pt-6'
    } text-zinc-800`}
  >
    {children}
  </div>
)
