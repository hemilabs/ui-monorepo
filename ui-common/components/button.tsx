const sizes = {
  large: 'h-14',
  small: 'h-10',
} as const

type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { size?: keyof typeof sizes }

export const Button = ({ disabled, size = 'large', ...props }: Props) => (
  <button
    className={`${
      sizes[size]
    } w-full cursor-pointer rounded-xl bg-black text-base text-white ${
      disabled
        ? 'cursor-not-allowed bg-opacity-60'
        : 'cursor-pointer hover:bg-opacity-80'
    }`}
    disabled={disabled}
    {...props}
  />
)
