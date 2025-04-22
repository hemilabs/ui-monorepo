import { Card } from 'components/card'
import { ReactNode } from 'react'

import { Step } from './step'

type Props = {
  children: ReactNode
  step: {
    description: string
    position: number
  }
} & ({ card?: true; heading: string; subheading: string } | { card: false })

export const Section = ({ children, step, ...props }: Props) => (
  <section className="mt-8 flex flex-col gap-y-6">
    <Step {...step} />
    {props.card !== false ? (
      <Card>
        <div className="flex flex-col gap-y-6 p-4 font-medium lg:flex-row lg:justify-between lg:p-6">
          <div>
            <h3 className="text-base text-neutral-950">{props.heading}</h3>
            <p className="mt-1 text-sm text-neutral-600">{props.subheading}</p>
          </div>
          {children}
        </div>
      </Card>
    ) : (
      children
    )}
  </section>
)
