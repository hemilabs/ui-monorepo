import { ComponentProps } from 'react'

type Props = ComponentProps<'div'>

export const Card = (props: Props) => (
  <div className="card-container rounded-xl bg-white shadow-md" {...props} />
)
