'use client'

import { ExclamationMark } from 'components/icons/exclamationMark'
import { Image } from 'components/image'

import 'styles/globals.css'

import { error404 } from './_images/error404'

export default function NotFound() {
  return (
    <div className="flex h-screen">
      <Image
        alt="404"
        className="absolute inset-0 -top-64 m-auto w-72 md:w-fit"
        {...error404}
      />
      <div className="z-10 m-auto flex flex-col items-center gap-4">
        <ExclamationMark />
        <div className="text-center">
          <h3>Oops! Page not found</h3>
          <p className="mt-1 font-medium text-neutral-500">
            We can&apos;t find the page you&apos;re looking for.
          </p>
        </div>
        <a
          className="button--base button-primary button-small button-regular"
          href="/"
        >
          Go back home
        </a>
      </div>
    </div>
  )
}
