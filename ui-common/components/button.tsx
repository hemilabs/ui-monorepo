const sizes = {
  large: 'h-14',
  small: 'h-10',
} as const

const variants = {
  primary: 'bg-black text-white',
  secondary:
    'bg-white text-orange-1 border border-slate-100 px-3 leading-none h-9',
} as const

type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { size?: keyof typeof sizes; variant?: keyof typeof variants }

export const Button = ({ disabled, size = 'large', ...props }: Props) => (
  <button
    className={`
      ${sizes[size]}
      ${variants[props.variant ?? 'primary']} 
      w-full cursor-pointer rounded-xl text-base
      ${
        disabled
          ? 'cursor-not-allowed bg-opacity-60'
          : 'cursor-pointer hover:bg-opacity-80'
      }
    `}
    disabled={disabled}
    {...props}
  />
)
