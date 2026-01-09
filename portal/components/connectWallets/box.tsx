'use client'

import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  topContent: ReactNode
}

export const Box = ({ children, topContent }: Props) => (
  <div className="flex w-full flex-col gap-y-2">
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex w-full items-center justify-between p-4">
        {topContent}
      </div>
      <div className="flex h-24">{children}</div>
    </div>
  </div>
)
