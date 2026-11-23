export const TokenInputError = ({
  id,
  message,
}: {
  id: string
  message?: string
}) => (
  <span aria-live="polite" className="text-rose-500" id={id}>
    {message}
  </span>
)
