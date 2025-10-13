import * as Sentry from '@sentry/nextjs'
import { ExternalLink } from 'components/externalLink'
import { ExclamationMark } from 'components/icons/exclamationMark'
import hemiSocials from 'hemi-socials'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect } from 'react'

import svg500Error from './500.svg'

const { discordUrl } = hemiSocials

type Props = {
  description: ReactNode
  error: Error
  reset: VoidFunction
  title: string
  tryAgainLabel: string
}

export const Error500 = function ({
  description,
  error,
  reset,
  title,
  tryAgainLabel,
}: Props) {
  useEffect(
    function recordErrorOnSentry() {
      Sentry.captureException(error)
    },
    [error],
  )

  return (
    <div className="flex h-full">
      <Image
        alt="hemi 500 error background"
        className="-top-15 absolute inset-0 -z-10 m-auto w-4/5"
        src={svg500Error}
      />
      <div className="m-auto flex flex-col items-center gap-4">
        <ExclamationMark />
        <div className="w-96 text-center max-md:max-w-[80%]">
          <h1 className="text-4xl font-medium">{title}</h1>
          <h3 className="mt-1 text-sm font-medium text-neutral-500">
            {description}
          </h3>
        </div>
        <button
          className="button--base button-primary button-small button-regular"
          onClick={reset}
          type="button"
        >
          {tryAgainLabel}
        </button>
      </div>
    </div>
  )
}

export const LocalizedError500 = function (
  props: Pick<Props, 'error' | 'reset'>,
) {
  const t = useTranslations()

  return (
    <Error500
      {...props}
      description={t.rich('error-pages.unhandled-error.description', {
        link: chunk => (
          <ExternalLink
            className="text-orange-500 hover:text-orange-700"
            href={discordUrl}
          >
            {chunk}
          </ExternalLink>
        ),
      })}
      title={t('error-pages.unhandled-error.title')}
      tryAgainLabel={t('common.try-again')}
    />
  )
}
