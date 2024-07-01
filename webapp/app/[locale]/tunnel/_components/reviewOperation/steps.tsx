import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { getFormattedValue } from 'utils/format'

type ProgressStatus = 'completed' | 'idle' | 'progress' | 'ready'

const CheckIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 6.83333L7.5 10.5L6.16667 9.16667M14.5 8.5C14.5 11.8137 11.8137 14.5 8.5 14.5C5.18629 14.5 2.5 11.8137 2.5 8.5C2.5 5.18629 5.18629 2.5 8.5 2.5C11.8137 2.5 14.5 5.18629 14.5 8.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.33333"
    />
  </svg>
)

const ClockIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 3.83337V6.50004H5.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M2.84113 10.5C3.6648 12.8304 5.88727 14.5 8.49971 14.5C11.8134 14.5 14.4997 11.8137 14.4997 8.5C14.4997 5.18629 11.8134 2.5 8.49971 2.5C6.01361 2.5 3.88066 4.01204 2.97032 6.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M8.5 5.83337V8.50004L10.5 10.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

const backgroundColors = {
  completed: 'bg-green-500/20',
  idle: 'bg-zinc-50',
  progress: 'bg-orange-600/20',
  // uses same color as progress :shrug:
  ready: 'bg-orange-600/20',
}

const iconColors = {
  completed: '[&>svg>path]:stroke-green-600',
  idle: '[&>svg>path]:stroke-slate-500',
  progress: '[&>svg>path]:stroke-orange-600',
  // uses same color as progress :shrug:
  ready: '[&>svg>path]:stroke-orange-600',
}

const textColors = {
  completed: 'text-green-600',
  idle: 'text-slate-500',
  progress: 'text-orange-600',
  ready: 'text-orange-600',
}

type StepProps = {
  fees?: {
    amount: string
    symbol: string
  }
  feesIcon?: ReactNode
  icon: ReactNode
  status: ProgressStatus
  text: string
}

export const Step = function ({
  fees,
  feesIcon,
  icon,
  text,
  status,
}: StepProps) {
  const border = status === 'idle' ? 'border border-solid border-slate-100' : ''
  return (
    <div
      className={`flex items-center gap-x-2 rounded-lg p-2 text-xs font-medium md:text-sm ${backgroundColors[status]} ${border} ${textColors[status]}`}
    >
      <div className={iconColors[status]}>
        {status === 'completed' ? <CheckIcon /> : icon}
      </div>
      <p className="mr-auto">{text}</p>
      {fees && status !== 'completed' ? (
        <>
          {feesIcon && <div className={iconColors[status]}>{feesIcon}</div>}
          <span className="text-[10px] font-normal sm:text-xs">
            {`${getFormattedValue(fees.amount)} ${fees.symbol}`}
          </span>
        </>
      ) : null}
    </div>
  )
}

type SubStepProps = {
  status: ProgressStatus
  text: string
}

export const SubStep = function ({ status, text }: SubStepProps) {
  const t = useTranslations('common')

  const completed = status === 'completed'
  return (
    <div
      className={`flex items-center gap-x-2 px-2 text-xs font-medium ${
        iconColors[status] ?? iconColors.idle
      }`}
    >
      {completed ? <CheckIcon /> : <ClockIcon />}
      <span className={textColors[status] ?? textColors.idle}>
        {completed ? t('wait-complete') : text}
      </span>
    </div>
  )
}
