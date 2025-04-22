import { ReactNode } from 'react'

export const CallToActionContainer = ({
  children,
}: {
  children: ReactNode
}) => (
  <div
    className="mt-auto flex w-full flex-col items-end
      border-t border-solid border-neutral-300/55 bg-neutral-50 p-6"
  >
    {children}
  </div>
)
