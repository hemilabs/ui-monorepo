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
  <div className={`relative z-0 flex w-full flex-col ${bottom ? '-mb-3' : ''}`}>
    <div className={`${commonCss} z-10 justify-between ${top.bgColor}`}>
      {top.children}
    </div>
    {bottom && (
      <div
        className="pt-4.5 relative flex h-[50px] w-full -translate-y-2 items-center gap-x-1
  rounded-b-lg border border-solid border-neutral-300/55 bg-neutral-100 px-4 pb-2.5"
      >
        {bottom}
      </div>
    )}
  </div>
)
