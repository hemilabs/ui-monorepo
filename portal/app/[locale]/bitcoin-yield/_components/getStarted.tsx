'use client'

import { P } from 'components/paragraph'
import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import Image, { StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'

import step1 from './images/step1.svg'
import step2 from './images/step2.svg'
import step3 from './images/step3.svg'

const Step = ({
  heading,
  image,
  subheading,
}: {
  heading: string
  image: StaticImageData
  subheading: string
}) => (
  <div className="flex flex-col items-center gap-x-3 gap-y-2 md:flex-row">
    <div>
      <Image alt="Step image" height={80} src={image} width={80} />
    </div>
    <div className="flex w-full flex-col justify-center gap-y-1 max-md:text-center">
      <h4>{heading}</h4>
      <P className="text-neutral-500">{subheading}</P>
    </div>
  </div>
)

export const GetStarted = function () {
  const { symbol } = useHemiBtcToken()
  const t = useTranslations()

  return (
    <article
      className="flex flex-col items-center justify-between gap-x-5 
      gap-y-10 border-t border-solid border-neutral-300/55 py-6 sm:flex-row"
    >
      <Step
        heading={t('common.connect-wallet')}
        image={step1}
        subheading={t('bitcoin-yield.link-your-wallet')}
      />
      <Step
        heading={t('bitcoin-yield.tunnel-btc')}
        image={step2}
        subheading={t('bitcoin-yield.bridge-btc-and-receive', { symbol })}
      />
      <Step
        heading={t('bitcoin-yield.start-earning')}
        image={step3}
        subheading={t('bitcoin-yield.put-to-work', { symbol })}
      />
    </article>
  )
}
