import { Card } from 'components/card'
import { useTranslations } from 'next-intl'

import { Section } from './section'

const Box = ({
  heading,
  subheading,
}: {
  heading: string
  subheading: string
}) => (
  <Card>
    <div className="text-ms flex flex-col gap-y-4 p-2 pb-4 font-medium leading-5">
      <div className="h-[120px]"></div>
      <div className="px-2">
        <h5 className="text-neutral-950">{heading}</h5>
        <p className="text-neutral-500">{subheading}</p>
      </div>
    </div>
  </Card>
)

export const StartUsingHemi = function () {
  const t = useTranslations('get-started')
  return (
    <Section
      card={false}
      step={{
        description: t('start-using-hemi'),
        position: 3,
      }}
    >
      <div className="flex flex-col gap-y-4 md:flex-row md:gap-x-6">
        <Box
          heading={t('tunnel-assets')}
          subheading={t('learn-about-tunneling')}
        />
        <Box
          heading={t('swap-tokens')}
          subheading={t('learn-about-tunneling')}
        />
        <Box
          heading={t('deploy-a-smart-contract')}
          subheading={t('learn-to-deploy-smart-contract')}
        />
      </div>
    </Section>
  )
}
