import { ComponentProps } from 'react'

type Props = ComponentProps<'div'> & {
  height?: 'h-auto' | 'h-full'
  shadow?: 'shadow-soft' | 'shadow-large'
}

export const Card = ({
  height = 'h-auto',
  shadow = 'shadow-large',
  ...props
}: Props) => (
  <div
    className={`card-container rounded-2xl border border-solid border-neutral-300/55 bg-white ${shadow} ${height}`}
    {...props}
  />
)
