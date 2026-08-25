import { ExternalLink } from 'components/externalLink'
import { ExclamationMark } from 'components/icons/exclamationMark'
import { Image } from 'components/image'
import hemiSocials from 'hemi-socials'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import { errorArtwork } from './errorArtwork'

const { discordUrl } = hemiSocials

type Props = {
  description: ReactNode
  reset: VoidFunction
  title: string
  tryAgainLabel: string
}

const Error500 = ({ description, reset, title, tryAgainLabel }: Props) => (
  <div className="flex h-full">
    <Image
      alt="hemi 500 error background"
      className="absolute inset-0 -top-15 -z-10 m-auto w-4/5"
      {...errorArtwork}
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

export const LocalizedError500 = function (props: Pick<Props, 'reset'>) {
  const t = useTranslations()

  return (
    <Error500
      {...props}
      description={t.rich('error-pages.unhandled-error.description', {
        link: chunk => (
          <ExternalLink className="hoverable-text" href={discordUrl}>
            {chunk}
          </ExternalLink>
        ),
      })}
      title={t('error-pages.unhandled-error.title')}
      tryAgainLabel={t('common.try-again')}
    />
  )
}

export const UntranslatedError500 = (props: Pick<Props, 'reset'>) => (
  <Error500
    {...props}
    description={
      <>
        An unexpected error has occurred. Please try again or
        <ExternalLink className="hoverable-text" href={discordUrl}>
          {' '}
          contact us{' '}
        </ExternalLink>
        if the problem persists.
      </>
    }
    title="Something Went Wrong"
    tryAgainLabel="Try again"
  />
)
