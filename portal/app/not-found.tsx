'use client'

import { ExclamationMark } from 'components/icons/exclamationMark'
import Image from 'next/image'

import 'styles/globals.css'

import Error404 from './_images/404.svg'

export default function NotFound() {
  return (
    <div className="flex h-screen">
      <Image
        alt="404"
        className="absolute inset-0 -top-64 m-auto w-72 md:w-fit"
        src={Error404}
      />
      <div className="z-10 m-auto flex flex-col items-center gap-4">
        <ExclamationMark />
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-neutral-950">
            Oops! Page not found
          </h1>
          <h3 className="mt-1 text-sm font-medium text-neutral-500">
            We can&apos;t find the page you&apos;re looking for.
          </h3>
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
