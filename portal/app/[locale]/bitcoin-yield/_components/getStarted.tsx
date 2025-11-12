'use client'

import { Button } from 'components/button'
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
    <article className="group/get-started relative gap-x-5 gap-y-10 border-t border-solid border-neutral-300/55 py-6">
      <div
        className="duration-400 transition-filter flex flex-col items-center justify-between
        group-hover/get-started:opacity-65 group-hover/get-started:blur-sm sm:flex-row"
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
      </div>
      <div
        className="duration-400 scale absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-95 opacity-0
        transition-all delay-75 group-hover/get-started:scale-100 group-hover/get-started:opacity-100"
      >
        <Button size="xSmall" type="button" variant="secondary">
          {t('common.close')}
        </Button>
      </div>
    </article>
  )
}
