import { Card } from 'components/card'
import { ReactNode } from 'react'

import { Step } from './step'

type Props = {
  children: ReactNode
  heading: string
  step: {
    description: string
    position: number
  }
  subheading: string
}
export const Section = ({ children, heading, step, subheading }: Props) => (
  <section className="mt-8 flex flex-col gap-y-6">
    <Step {...step} />
    <Card>
      <div className="flex flex-col gap-y-6 p-4 font-medium md:flex-row md:justify-between md:p-6">
        <div>
          <h3 className="text-base text-neutral-950">{heading}</h3>
          <p className="text-ms mt-1 leading-5 text-neutral-600">
            {subheading}
          </p>
        </div>
        {children}
      </div>
    </Card>
  </section>
)
