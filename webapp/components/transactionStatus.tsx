import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'
import { useAccount } from 'wagmi'

const Error = () => (
  <svg
    fill="none"
    height="29"
    viewBox="0 0 28 29"
    width="28"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 23.4447C19.0977 23.4447 23.2812 19.2523 23.2812 14.1547C23.2812 9.0658 19.0889 4.87341 14 4.87341C8.90234 4.87341 4.71875 9.0658 4.71875 14.1547C4.71875 19.2523 8.91113 23.4447 14 23.4447ZM14 21.1332C10.1416 21.1332 7.03906 18.0219 7.03906 14.1547C7.03906 10.2963 10.1328 7.18494 14 7.18494C17.8584 7.18494 20.9697 10.2963 20.9697 14.1547C20.9785 18.0219 17.8672 21.1332 14 21.1332ZM11.293 17.8021C11.583 17.8021 11.8115 17.7142 11.9961 17.5209L14 15.517L16.0127 17.5209C16.1973 17.7054 16.4258 17.8021 16.707 17.8021C17.2432 17.8021 17.6562 17.389 17.6562 16.8529C17.6562 16.598 17.5508 16.3695 17.3662 16.1937L15.3535 14.1722L17.375 12.142C17.5596 11.9486 17.6562 11.7289 17.6562 11.4828C17.6562 10.9467 17.2432 10.5336 16.7158 10.5336C16.4346 10.5336 16.2148 10.6215 16.0215 10.8148L14 12.8275L11.9873 10.8236C11.8027 10.6302 11.583 10.5424 11.293 10.5424C10.7656 10.5424 10.3525 10.9554 10.3525 11.4916C10.3525 11.7377 10.4492 11.9662 10.6338 12.142L12.6553 14.1722L10.6338 16.1937C10.4492 16.3695 10.3525 16.6068 10.3525 16.8529C10.3525 17.389 10.7656 17.8021 11.293 17.8021Z"
      fill="#C14D4F"
    />
  </svg>
)

const Loading = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="stroke-amber-500"
      d="M2 3.34277V6.00944H4.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      className="stroke-amber-500"
      d="M2.34119 10.0093C3.16486 12.3397 5.38733 14.0093 7.99977 14.0093C11.3135 14.0093 13.9998 11.323 13.9998 8.00928C13.9998 4.69557 11.3135 2.00928 7.99977 2.00928C5.51367 2.00928 3.38072 3.52132 2.47038 5.67594"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      className="stroke-amber-500"
      d="M8 5.34277V8.00944L10 10.0094"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

const Success = () => (
  <svg
    fill="none"
    height="15"
    viewBox="0 0 15 15"
    width="15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.63343 5.7316L6.43343 9.64271L5.01121 8.22049M13.9001 7.50937C13.9001 11.044 11.0347 13.9094 7.5001 13.9094C3.96548 13.9094 1.1001 11.044 1.1001 7.50937C1.1001 3.97475 3.96548 1.10938 7.5001 1.10938C11.0347 1.10938 13.9001 3.97475 13.9001 7.50937Z"
      stroke="#10A732"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

const ExternalLink = () => (
  <svg
    fill="none"
    height="24"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 15.0093V6.00928M18 6.00928H9M18 6.00928L6.25 17.7593"
      stroke="black"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
)

type Props = {
  status: 'error' | 'loading' | 'success'
  text: string
  txHash: string | undefined
}

export const TransactionStatus = function ({ status, text, txHash }: Props) {
  const { chain } = useAccount()
  const t = useTranslations('common.transaction-status')

  const statusMap = {
    error: {
      color: 'text-rose-700',
      text: t('error'),
    },
    loading: {
      color: 'text-amber-500',
      text: t('pending'),
    },
    success: {
      color: 'text-green-600',
      text: t('confirmed'),
    },
  } as const

  const icons = {
    error: <Error />,
    loading: <Loading />,
    success: <Success />,
  }

  return (
    <Card padding="medium">
      <div className="flex min-w-72 items-start gap-x-2">
        <div className="w-6">{icons[status]}</div>
        <div className="flex w-full flex-col gap-y-1">
          <p className="text-sm font-semibold leading-none">{text}</p>
          <div className="flex items-center">
            <p
              className={`text-xs font-medium capitalize ${statusMap[status].color}`}
            >
              {statusMap[status].text}
            </p>
          </div>
        </div>
        <a
          className={`cursor-pointer ${txHash ? '' : 'invisible'}`}
          href={`${chain.blockExplorers.default.url}/tx/${txHash}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink />
        </a>
      </div>
    </Card>
  )
}
