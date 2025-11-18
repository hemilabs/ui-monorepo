'use client'

import { ExternalLink } from 'components/externalLink'
import { CheckMark } from 'components/icons/checkMark'
import { CloseIcon } from 'components/icons/closeIcon'
import { Link } from 'components/link'
import { type ComponentProps, useEffect, useState } from 'react'

type Props = {
  autoCloseMs?: number
  description: string
  goTo?: {
    href: ComponentProps<typeof Link>['href']
    label: string
  }
  tx: {
    href: ComponentProps<typeof ExternalLink>['href']
    label: string
  }
  title: string
}

export const Toast = function ({
  autoCloseMs = 10000,
  description,
  goTo,
  title,
  tx,
}: Props) {
  const [closedToast, setClosedToast] = useState(false)

  useEffect(
    function autoCloseToast() {
      if (autoCloseMs) {
        const timer = setTimeout(function closeToastAfterDelay() {
          setClosedToast(true)
        }, autoCloseMs)

        return () => clearTimeout(timer)
      }
      return undefined
    },
    [autoCloseMs],
  )

  if (closedToast) {
    return null
  }

  return (
    <div
      className="fixed inset-x-4 bottom-20 z-40 flex justify-between
      gap-x-3 rounded-xl border border-solid border-black/85 bg-neutral-800 p-3.5
    text-sm font-medium text-white md:bottom-auto md:left-auto md:right-8 md:top-20"
    >
      <div className="mt-1.5">
        <CheckMark className="[&>path]:stroke-emerald-500" />
      </div>
      <div className="flex flex-col items-start gap-y-1.5">
        <h5 className="text-base">{title}</h5>
        <p className="text-neutral-400 md:max-w-96">
          {description}
          <ExternalLink href={tx.href}>
            <span className="ml-1 text-orange-500 hover:text-orange-700">
              {tx.label}
            </span>
          </ExternalLink>
        </p>
        {goTo !== undefined && (
          <Link
            className="mt-1.5 cursor-pointer underline hover:text-neutral-200 hover:opacity-80"
            href={goTo.href}
          >
            {goTo.label}
          </Link>
        )}
      </div>
      <button className="size-5" onClick={() => setClosedToast(true)}>
        <CloseIcon className="size-full [&>path]:hover:stroke-white" />
      </button>
    </div>
  )
}
