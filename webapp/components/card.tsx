import { ComponentProps } from 'react'

type Props = ComponentProps<'div'>

export const Card = (props: Props) => (
  <div
    className="border-neutral-300/56 rounded-2xl border border-solid bg-white"
    style={{
      boxShadow:
        '0px 2px 4px 0px rgba(0, 2, 2, 0.04), 0px 8px 24px -4px rgba(0, 2, 2, 0.04)',
    }}
    {...props}
  />
)
