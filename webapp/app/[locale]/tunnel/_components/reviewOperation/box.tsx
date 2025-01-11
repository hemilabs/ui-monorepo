import { ReactNode } from 'react'

const commonCss =
  'h-13 w-full rounded-lg border border-solid border-neutral-300/55 p-4 flex items-center'

type BoxProps = {
  bgColor: 'bg-neutral-50' | 'bg-neutral-100' | 'bg-white'
  children: ReactNode
}

export const OneRowBox = ({ bgColor, children }: BoxProps) => (
  <div className={`${commonCss} ${bgColor}`}>{children}</div>
)

export const TwoRowBox = ({
  bottom,
  top,
}: {
  bottom: ReactNode
  top: BoxProps
}) => (
  <div className="flex w-full flex-col">
    <div className={`${commonCss} z-10 -mb-3 justify-between ${top.bgColor}`}>
      {top.children}
    </div>
    {bottom && (
      <div
        className="flex h-14 w-full items-center gap-x-1 rounded-lg
  border border-solid border-neutral-300/55 bg-neutral-100 px-4 pb-4 pt-6"
      >
        {bottom}
      </div>
    )}
  </div>
)
