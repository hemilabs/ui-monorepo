'use client'

import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  topContent: ReactNode
  walletName: string
  walletType: string
}

export const Box = function ({
  children,
  topContent,
  walletName,
  walletType,
}: Props) {
  const t = useTranslations('connect-wallets')

  return (
    <div className="flex flex-col gap-y-2">
      <div className="text-ms flex items-center justify-between leading-5 text-neutral-500">
        <span>{walletType}</span>
        <span>
          {t.rich('connected-with-wallet', {
            wallet: () => (
              <span className="text-neutral-950">{walletName}</span>
            ),
          })}
        </span>
      </div>
      <div className="rounded-xl border border-solid border-neutral-300/55 bg-white p-2 shadow-sm">
        <div className="flex w-full items-center justify-between rounded-md border border-solid bg-neutral-300/55 bg-neutral-50 px-2 py-1">
          {topContent}
        </div>
        <div className="h-24">{children}</div>
      </div>
    </div>
  )
}
