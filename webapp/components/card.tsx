import { ComponentProps } from 'react'

type Props = ComponentProps<'div'> & {
  shadow?: 'shadow-soft' | 'shadow-large'
}

export const Card = ({ shadow = 'shadow-large', ...props }: Props) => (
  <div
    className={`rounded-2xl border border-solid border-neutral-300/55 bg-white ${shadow}`}
    {...props}
  />
)
