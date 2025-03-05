'use client'

import * as Sentry from '@sentry/nextjs'
import { ExclamationMark } from 'components/icons/exclamationMark'
import hemiSocials from 'hemi-socials'
import Image from 'next/image'
import { useEffect } from 'react'

import Error500 from './_images/500.svg'

const { discordUrl } = hemiSocials

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(
    function () {
      Sentry.captureException(error)
    },
    [error],
  )

  return (
    <div className="flex h-screen">
      <Image
        alt="500"
        className="absolute inset-0 -top-60 m-auto w-72 md:-top-96 md:w-fit"
        src={Error500}
      />
      <div className="z-10 m-auto flex flex-col items-center gap-4">
        <ExclamationMark />
        <div className="w-96 text-center">
          <h1 className="text-lg font-medium text-neutral-950">
            Something Went Wrong
          </h1>
          <h3 className="mt-1 text-base font-medium text-neutral-500">
            An unexpected error has occurred. Please try again or
            <a
              className="text-orange-500 hover:text-orange-700"
              href={discordUrl}
            >
              {' '}
              contact us{' '}
            </a>
            if the problem persists.
          </h3>
        </div>
        <button className="button button--primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  )
}
