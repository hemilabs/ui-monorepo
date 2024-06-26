'use client'

import { AbstractIntlMessages, useMessages, useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import Skeleton from 'react-loading-skeleton'
import { Card } from 'ui-common/components/card'

export const profiles = ['dev', 'miner', 'explorers'] as const
export type Profile = (typeof profiles)[number]

const ArrowIcon = () => (
  <svg
    fill="none"
    height={10}
    viewBox="0 0 10 10"
    width={10}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.99988 7.12766V1H2.87222M0.999878 9L8.31903 1.68085"
      stroke="#1A1B1B"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
)

const InfoBoxCard = ({ text, title }: { text: string; title: string }) => (
  <Card borderColor="gray" padding="small" shadow="extraSoft">
    <div className="flex flex-col">
      <div className="just flex flex-row items-start justify-between">
        <h5 className="my-1 h-fit text-sm font-medium leading-4">{title}</h5>
        <div className="ml-1 mt-2 inline">
          <ArrowIcon />
        </div>
      </div>
      <p className="text-[10px] font-normal text-slate-500">{text}</p>
    </div>
  </Card>
)

const InfoBox = function ({
  text,
  title,
  url,
}: {
  text: string
  title: string
  url: string
}) {
  const urlSchemePostfixRegex = /(?=:\/\/)/g
  const isExternalUrl = url.match(urlSchemePostfixRegex)

  const linkClassName = 'grid md:max-w-44 lg:max-w-56'

  return isExternalUrl ? (
    <a
      className={linkClassName}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <InfoBoxCard text={text} title={title} />
    </a>
  ) : (
    <Link className={linkClassName} href={url}>
      <InfoBoxCard text={text} title={title} />
    </Link>
  )
}

export const QuickStart = function ({ profile }: { profile?: Profile }) {
  const allMessages = useMessages()
  const messages = allMessages['get-started'] as AbstractIntlMessages
  const t = useTranslations('get-started')
  return (
    <section className="mt-4 flex flex-col items-start gap-3 md:items-start">
      <h3 className="p-0 text-2xl font-semibold leading-9">
        {t('steps.heading')}
      </h3>
      <div className="grid grid-flow-row grid-cols-2 gap-3 md:auto-cols-fr md:grid-flow-col md:gap-6">
        {profile !== undefined &&
          Object.values(messages.steps[profile]).map(
            ({
              text,
              title,
              url,
            }: {
              text: string
              title: string
              url: string
            }) => <InfoBox key={title} text={text} title={title} url={url} />,
          )}
        {profile === undefined &&
          Array.from(Array(5).keys()).map(index => (
            <Skeleton className="h-20 w-56" key={index} />
          ))}
      </div>
    </section>
  )
}
