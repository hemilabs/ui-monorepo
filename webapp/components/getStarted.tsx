'use client'

import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'
import { Card } from 'ui-common/components/card'
import { DeveloperIcon } from 'ui-common/components/developerIcon'
import { IndividualIcon } from 'ui-common/components/individualIcon'
import { MinerIcon } from 'ui-common/components/minerIcon'

type Props = React.DetailedHTMLProps<
  React.AllHTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  onDeveloperSelected: () => void
  onMinerSelected: () => void
  onIndividualSelected: () => void
}

export function GetStarted({
  onDeveloperSelected,
  onMinerSelected,
  onIndividualSelected,
  className,
}: Props) {
  const t = useTranslations('get-started-page')

  return (
    <div
      className={`flex h-full flex-row justify-center bg-black bg-opacity-25 backdrop-blur-sm
                    ${className ?? ''}`}
    >
      <div className="m-auto max-md:p-6">
        <Card radius="large" shadow="regular">
          <div className="px-4 py-8 text-center">
            <h1 className="text-4xl font-medium tracking-tighter">
              {t('heading')}
            </h1>
            <h2 className="text-gray-6 mb-12 mt-4 text-lg">
              {t('sub-heading')}
            </h2>

            <div className="grid grid-flow-row grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  handler: onDeveloperSelected,
                  icon: <DeveloperIcon />,
                  label: t('options.developer'),
                },
                {
                  handler: onMinerSelected,
                  icon: <MinerIcon />,
                  label: t('options.miner'),
                },
                {
                  handler: onIndividualSelected,
                  icon: <IndividualIcon />,
                  label: t('options.individual'),
                },
              ].map(({ icon, handler, label }) => (
                <Card borderColor="gray" key={label}>
                  <div className="flex flex-col items-center px-2 py-4">
                    <div className="mb-10 mt-16">{icon}</div>
                    <Button onClick={handler} variant="secondary">
                      {label}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
