export const Header = ({
  className = '',
  text,
}: {
  className?: string
  text: string
}) => (
  <span
    className={`block py-3 text-left font-medium text-neutral-600 ${className}`}
  >
    {text}
  </span>
)
