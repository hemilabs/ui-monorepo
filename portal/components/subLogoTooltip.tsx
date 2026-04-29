import { Tooltip } from 'components/tooltip'
import { ComponentProps, ReactNode } from 'react'

type SubLogoTooltipProps = {
  children: ReactNode
  icon?: ReactNode
  tooltipText?: string
}

const SubLogoInfoIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height="12"
    viewBox="0 0 12 12"
    width="12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M6 0.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm0 2.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm0 2.625a.563.563 0 0 0-.563.563v2.25a.563.563 0 1 0 1.126 0v-2.25A.563.563 0 0 0 6 5.625Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

export const SubLogoTooltip = ({
  children,
  icon,
  tooltipText,
}: SubLogoTooltipProps) => (
  <Tooltip disabled={!tooltipText} text={tooltipText} variant="simple">
    <div className="group/sub-logo inline-flex rounded-lg bg-neutral-50 p-2">
      <div className="relative inline-flex">
        {children}
        {tooltipText && (
          <span
            className="absolute bottom-0 right-0 z-10 inline-flex translate-x-1/2 translate-y-1/2 items-center justify-center
              rounded-full border-[1.6px] border-solid border-white bg-white"
          >
            {icon ?? (
              <SubLogoInfoIcon className="size-3 text-neutral-500 transition-colors duration-200 group-hover/sub-logo:text-neutral-900" />
            )}
          </span>
        )}
      </div>
    </div>
  </Tooltip>
)
