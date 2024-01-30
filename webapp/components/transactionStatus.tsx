import { Card } from 'components/design/card'
import { useNetwork } from 'wagmi'

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

const Spinner = () => (
  <svg
    color="#F16063"
    fill="none"
    height="32"
    viewBox="0 0 200 200"
    width="32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="spinner-secondHalf">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
        <stop offset="100%" stopColor="#7460F1" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="spinner-firstHalf">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="#7460F1" stopOpacity="0.3" />
      </linearGradient>
    </defs>

    <g strokeWidth="8">
      <path
        d="M 4 100 A 96 96 0 0 1 196 100"
        stroke="url(#spinner-secondHalf)"
      />
      <path
        d="M 196 100 A 96 96 0 0 1 4 100"
        stroke="url(#spinner-firstHalf)"
      />

      <path
        d="M 4 100 A 96 96 0 0 1 4 98"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </g>

    <animateTransform
      attributeName="transform"
      dur="1300ms"
      from="0 0 0"
      repeatCount="indefinite"
      to="360 0 0"
      type="rotate"
    />
  </svg>
)

const Success = () => (
  <svg
    fill="none"
    height="29"
    viewBox="0 0 28 29"
    width="28"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 23.4443C19.0977 23.4443 23.2812 19.252 23.2812 14.1543C23.2812 9.06543 19.0889 4.87305 14 4.87305C8.90234 4.87305 4.71875 9.06543 4.71875 14.1543C4.71875 19.252 8.91113 23.4443 14 23.4443ZM14 21.1328C10.1416 21.1328 7.03906 18.0215 7.03906 14.1543C7.03906 10.2959 10.1328 7.18457 14 7.18457C17.8584 7.18457 20.9697 10.2959 20.9697 14.1543C20.9785 18.0215 17.8672 21.1328 14 21.1328ZM13.0771 18.3379C13.4375 18.3379 13.7627 18.1533 13.9736 17.8369L17.7441 12.0098C17.8848 11.7988 17.9814 11.5791 17.9814 11.3682C17.9814 10.8496 17.5244 10.4893 17.0322 10.4893C16.707 10.4893 16.4258 10.665 16.2148 11.0166L13.0596 16.0967L11.5918 14.2949C11.3721 14.0225 11.1348 13.9082 10.8447 13.9082C10.335 13.9082 9.92188 14.3125 9.92188 14.8223C9.92188 15.0684 10.001 15.2793 10.1855 15.5078L12.1543 17.8545C12.4092 18.1709 12.708 18.3379 13.0771 18.3379Z"
      fill="#01AE33"
    />
  </svg>
)

const ExternalLink = () => (
  <svg
    fill="none"
    height="25"
    viewBox="0 0 24 25"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 21.4443C17.0977 21.4443 21.2812 17.252 21.2812 12.1543C21.2812 7.06543 17.0889 2.87305 12 2.87305C6.90234 2.87305 2.71875 7.06543 2.71875 12.1543C2.71875 17.252 6.91113 21.4443 12 21.4443ZM12 19.1328C8.1416 19.1328 5.03906 16.0215 5.03906 12.1543C5.03906 8.2959 8.13281 5.18457 12 5.18457C15.8584 5.18457 18.9697 8.2959 18.9697 12.1543C18.9785 16.0215 15.8672 19.1328 12 19.1328ZM14.7158 14.6416C15.2432 14.6416 15.5684 14.2549 15.5684 13.6836V9.69336C15.5684 8.94629 15.1377 8.55957 14.417 8.55957H10.4092C9.8291 8.55957 9.45117 8.88477 9.45117 9.41211C9.45117 9.93945 9.8291 10.2734 10.4092 10.2734H11.6924L12.7207 10.1328L11.5342 11.1787L8.73047 13.9912C8.53711 14.1758 8.41406 14.4395 8.41406 14.7031C8.41406 15.2832 8.85352 15.6699 9.39844 15.6699C9.68848 15.6699 9.92578 15.5732 10.1543 15.3623L12.9316 12.5762L13.9775 11.3984L13.8545 12.4883V13.6836C13.8545 14.2725 14.1885 14.6416 14.7158 14.6416Z"
      fill="#B3B5B9"
    />
  </svg>
)

const statusMap = {
  error: {
    color: 'text-rose-700',
    text: 'Tx failed',
  },
  loading: {
    color: 'text-amber-500',
    text: 'Pending',
  },
  success: {
    color: 'text-green-600',
    text: 'Tx Confirmed',
  },
} as const

type Props = {
  status: 'error' | 'loading' | 'success'
  text: string
  txHash: string | undefined
}

export const TransactionStatus = function ({ status, text, txHash }: Props) {
  const { chain } = useNetwork()

  return (
    <Card>
      <div className="flex items-center gap-x-3">
        {status === 'error' && <Error />}
        {status === 'loading' && <Spinner />}
        {status === 'success' && <Success />}
        <div className="flex flex-col">
          <p className="text-sm font-semibold">{text}</p>
          <div className="flex items-center ">
            <p
              className={`text-xs font-medium capitalize ${statusMap[status].color}`}
            >
              {statusMap[status].text}
            </p>
          </div>
        </div>
        <a
          className="ml-auto cursor-pointer"
          href={
            txHash
              ? `${chain.blockExplorers.default.url}/tx/${txHash}`
              : undefined
          }
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink />
        </a>
      </div>
    </Card>
  )
}
