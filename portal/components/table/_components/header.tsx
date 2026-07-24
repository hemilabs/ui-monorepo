export const Header = ({
  className = '',
  text,
}: {
  className?: string
  text: string
}) => (
  <span
    className={`flex h-10 items-center text-left font-medium text-neutral-500 ${className}`}
  >
    {text}
  </span>
)
