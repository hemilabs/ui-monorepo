import { Card } from 'components/card'
import { ReactNode } from 'react'

import { Step } from './step'

type Props = {
  children: ReactNode
  step: {
    description?: string
    position: number
  }
} & ({ card?: true; heading: string; subheading: string } | { card: false })

export const Section = ({ children, step, ...props }: Props) => (
  <section className="relative mt-10 first:mt-8">
    <div className="absolute left-0 top-0 z-10">
      <Step {...step} />
    </div>
    {props.card !== false ? (
      <div className="pt-[68px]">
        <Card>
          <div className="flex flex-col gap-y-6 p-4 font-medium lg:flex-row lg:justify-between lg:p-6">
            <div>
              <h3 className="text-mid-md font-semibold text-neutral-950">
                {props.heading}
              </h3>
              <p className="mt-1 text-neutral-600">{props.subheading}</p>
            </div>
            {children}
          </div>
        </Card>
      </div>
    ) : (
      <div className="pt-[68px]">{children}</div>
    )}
  </section>
)
