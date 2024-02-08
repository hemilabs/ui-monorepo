type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export const Button = ({ disabled, ...props }: Props) => (
  <button
    className={`h-14 w-full cursor-pointer rounded-xl bg-black text-base text-white ${
      disabled
        ? 'cursor-not-allowed bg-opacity-60'
        : 'cursor-pointer hover:bg-opacity-80'
    }`}
    disabled={disabled}
    {...props}
  />
)
