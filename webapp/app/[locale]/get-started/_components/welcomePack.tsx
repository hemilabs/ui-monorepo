'use client'

import { useMutation } from '@tanstack/react-query'
import { hemi } from 'app/networks'
import { bitcoinTestnet } from 'btc-wallet/chains'
import { ExternalLink } from 'components/externalLink'
import fetch from 'fetch-plus-plus'
import hemiSocials from 'hemi-socials'
import { useLocale, useTranslations } from 'next-intl'
import { useReCaptcha } from 'next-recaptcha-v3'
import { FormEvent, ReactNode, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { Card } from 'ui-common/components/card'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { sepolia } from 'viem/chains'

import { Btc } from './icons/btc'
import { Eth } from './icons/eth'
import { Hemi } from './icons/hemi'
import { Profile } from './quickStart'

const EmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const giveAwayTokens = hemi.testnet
  ? [
      {
        amount: 0.2,
        icon: <Eth />,
        symbol: `${sepolia.nativeCurrency.symbol} (Sepolia ether)`,
      },
      {
        amount: 0.2,
        icon: <Eth />,
        symbol: `${hemi.nativeCurrency.symbol} (Tunneled Sepolia ether)`,
      },
      {
        amount: 0.1,
        icon: <Btc />,
        symbol: `${bitcoinTestnet.nativeCurrency.symbol} (testnet Bitcoin)`,
      },
      {
        amount: 1,
        icon: <Hemi />,
        symbol: 'tHEMI (testnet Hemi)',
      },
      {
        symbol: 'Hemi Hatchling NFT',
      },
    ]
  : // mainnet capsules not confirmed
    []

const CoinRow = ({
  amount,
  icon,
  symbol,
}: {
  amount?: number
  icon?: React.ReactNode
  symbol: string
}) => (
  <div className="flex w-fit items-center gap-x-2 rounded-lg bg-orange-100 px-2 py-1.5">
    {icon}
    <span className="text-sm font-medium text-orange-950">
      {[amount, symbol].filter(Boolean).join(' ')}
    </span>
  </div>
)

const DiscordIcon = () => (
  <svg
    className="inline"
    fill="none"
    height={17}
    width={17}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#path)">
      <path
        className="fill-slate-400"
        d="M14.045 3.27a13.195 13.195 0 0 0-3.257-1.01.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.181 12.181 0 0 0-3.658 0 8.426 8.426 0 0 0-.412-.833.051.051 0 0 0-.052-.025 13.158 13.158 0 0 0-3.257 1.01.047.047 0 0 0-.021.019C.856 6.388.287 9.41.566 12.396c.001.014.01.028.02.037a13.266 13.266 0 0 0 3.996 2.02.052.052 0 0 0 .056-.019 9.48 9.48 0 0 0 .818-1.33.05.05 0 0 0-.028-.07 8.746 8.746 0 0 1-1.248-.594.051.051 0 0 1-.005-.085c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007c.08.066.164.132.248.194a.051.051 0 0 1-.004.086c-.399.233-.813.43-1.249.594a.051.051 0 0 0-.027.07c.24.466.514.91.817 1.33a.05.05 0 0 0 .056.019 13.222 13.222 0 0 0 4.001-2.02.051.051 0 0 0 .021-.037c.334-3.45-.559-6.449-2.366-9.106a.04.04 0 0 0-.02-.02Zm-8.198 7.308c-.789 0-1.438-.724-1.438-1.613 0-.888.637-1.612 1.438-1.612.807 0 1.45.73 1.438 1.612 0 .89-.637 1.613-1.438 1.613Zm5.316 0c-.788 0-1.438-.724-1.438-1.613 0-.888.637-1.612 1.438-1.612.807 0 1.45.73 1.438 1.612 0 .89-.63 1.613-1.438 1.613Z"
        fill="#1A1A1A"
      />
    </g>
    <defs>
      <clipPath id="path">
        <path d="M.5.5h16v16H.5z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)

const EmailIcon = () => (
  <svg
    fill="none"
    height="10"
    viewBox="0 0 13 10"
    width="13"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-green-600"
      d="M11.1666 2.78301V7.21634H12.3333V2.78301H11.1666ZM9.88329 8.49968H3.11663V9.66634H9.88329V8.49968ZM1.83329 7.21634V2.78301H0.666627V7.21634H1.83329ZM3.11663 1.49968H9.88329V0.333009H3.11663V1.49968ZM3.11663 8.49968C2.78031 8.49968 2.56314 8.49921 2.39787 8.48573C2.23939 8.47278 2.18064 8.45079 2.1518 8.43609L1.62214 9.47559C1.84287 9.58806 2.07224 9.62965 2.30286 9.64849C2.52667 9.66681 2.79956 9.66634 3.11663 9.66634V8.49968ZM0.666627 7.21634C0.666627 7.53338 0.666172 7.80633 0.68446 8.03009C0.703301 8.26074 0.744905 8.49011 0.857365 8.71084L1.89687 8.18118C1.88218 8.1523 1.8602 8.09356 1.84725 7.93513C1.83375 7.76981 1.83329 7.55263 1.83329 7.21634H0.666627ZM2.1518 8.43609C2.04204 8.38015 1.9528 8.2909 1.89687 8.18118L0.857365 8.71084C1.02514 9.04013 1.29286 9.30783 1.62214 9.47559L2.1518 8.43609ZM11.1666 7.21634C11.1666 7.55263 11.1662 7.76981 11.1527 7.93513C11.1397 8.09356 11.1177 8.1523 11.103 8.18118L12.1425 8.71084C12.255 8.49011 12.2966 8.26074 12.3154 8.03009C12.3338 7.80633 12.3333 7.53338 12.3333 7.21634H11.1666ZM9.88329 9.66634C10.2004 9.66634 10.4733 9.66681 10.697 9.64849C10.9277 9.62965 11.1571 9.58806 11.3778 9.47559L10.8481 8.43609C10.8193 8.45079 10.7605 8.47278 10.6021 8.48573C10.4368 8.49921 10.2196 8.49968 9.88329 8.49968V9.66634ZM11.103 8.18118C11.0471 8.2909 10.9579 8.38015 10.8481 8.43609L11.3778 9.47559C11.7071 9.30783 11.9748 9.04013 12.1425 8.71084L11.103 8.18118ZM12.3333 2.78301C12.3333 2.46594 12.3338 2.19305 12.3154 1.96924C12.2966 1.73863 12.255 1.50925 12.1425 1.28853L11.103 1.81818C11.1177 1.84702 11.1397 1.90577 11.1527 2.06425C11.1662 2.22952 11.1666 2.44669 11.1666 2.78301H12.3333ZM9.88329 1.49968C10.2196 1.49968 10.4368 1.50013 10.6021 1.51363C10.7605 1.52658 10.8193 1.54856 10.8481 1.56325L11.3778 0.523747C11.1571 0.411286 10.9277 0.369683 10.697 0.350841C10.4733 0.332554 10.2004 0.333009 9.88329 0.333009V1.49968ZM12.1425 1.28853C11.9748 0.959241 11.7071 0.691526 11.3778 0.523747L10.8481 1.56325C10.9579 1.61918 11.0471 1.70842 11.103 1.81818L12.1425 1.28853ZM1.83329 2.78301C1.83329 2.44669 1.83375 2.22952 1.84725 2.06425C1.8602 1.90577 1.88218 1.84702 1.89687 1.81818L0.857365 1.28853C0.744905 1.50925 0.703301 1.73863 0.68446 1.96924C0.666172 2.19305 0.666627 2.46594 0.666627 2.78301H1.83329ZM3.11663 0.333009C2.79956 0.333009 2.52667 0.332554 2.30286 0.350841C2.07224 0.369683 1.84287 0.411286 1.62214 0.523747L2.1518 1.56325C2.18064 1.54856 2.23939 1.52658 2.39787 1.51363C2.56314 1.50013 2.78031 1.49968 3.11663 1.49968V0.333009ZM1.89687 1.81818C1.9528 1.70842 2.04204 1.61918 2.1518 1.56325L1.62214 0.523747C1.29286 0.691526 1.02514 0.959241 0.857365 1.28853L1.89687 1.81818ZM11.3806 0.836081L6.86933 4.52706L7.60812 5.43006L12.1193 1.73903L11.3806 0.836081ZM6.13059 4.52706L1.61935 0.836081L0.88057 1.73903L5.3918 5.43006L6.13059 4.52706ZM6.86933 4.52706C6.65449 4.70288 6.34544 4.70288 6.13059 4.52706L5.3918 5.43006C6.03644 5.95745 6.96348 5.95745 7.60812 5.43006L6.86933 4.52706Z"
    />
  </svg>
)

const ErrorIcon = () => (
  <svg
    fill="none"
    height="14"
    viewBox="0 0 14 14"
    width="14"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.91675 2.91699L11.0834 11.0837M11.0834 2.91699L2.91675 11.0837"
      stroke="#DC2626"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
)

const ResetIcon = () => (
  <svg
    fill="none"
    height="14"
    viewBox="0 0 15 14"
    width="15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-slate-400"
      d="M7.3291 0.753861C7.10131 0.526057 6.73194 0.526057 6.50415 0.753861C6.27634 0.98167 6.27634 1.35101 6.50415 1.57882L7.3291 0.753861ZM8.66663 2.91634L9.0791 3.32882C9.30689 3.10101 9.30689 2.73167 9.0791 2.50386L8.66663 2.91634ZM6.50415 4.25386C6.27634 4.48167 6.27634 4.85101 6.50415 5.07882C6.73194 5.30663 7.10131 5.30663 7.3291 5.07882L6.50415 4.25386ZM8.49577 9.74548C8.72356 9.51769 8.72356 9.14832 8.49577 8.92053C8.26798 8.69274 7.89861 8.69274 7.67082 8.92053L8.49577 9.74548ZM6.33329 11.083L5.92081 10.6705C5.69301 10.8983 5.69301 11.2677 5.92081 11.4955L6.33329 11.083ZM7.67082 13.2455C7.89861 13.4733 8.26798 13.4733 8.49577 13.2455C8.72356 13.0177 8.72356 12.6483 8.49577 12.4205L7.67082 13.2455ZM11.9999 3.73366C11.7745 3.50355 11.4051 3.49981 11.175 3.72529C10.9449 3.95078 10.9412 4.3201 11.1667 4.55021L11.9999 3.73366ZM8.08329 3.49968C8.40547 3.49968 8.66663 3.2385 8.66663 2.91634C8.66663 2.59418 8.40547 2.33301 8.08329 2.33301V3.49968ZM2.99999 10.2657C3.22547 10.4958 3.5948 10.4996 3.8249 10.274C4.055 10.0486 4.05875 9.67922 3.83327 9.44915L2.99999 10.2657ZM6.50415 1.57882L8.25415 3.32882L9.0791 2.50386L7.3291 0.753861L6.50415 1.57882ZM8.25415 2.50386L6.50415 4.25386L7.3291 5.07882L9.0791 3.32882L8.25415 2.50386ZM7.67082 8.92053L5.92081 10.6705L6.74577 11.4955L8.49577 9.74548L7.67082 8.92053ZM5.92081 11.4955L7.67082 13.2455L8.49577 12.4205L6.74577 10.6705L5.92081 11.4955ZM8.66663 10.4997H6.91663V11.6663H8.66663V10.4997ZM12.1666 6.99967C12.1666 8.93267 10.5996 10.4997 8.66663 10.4997V11.6663C11.244 11.6663 13.3333 9.57702 13.3333 6.99967H12.1666ZM13.3333 6.99967C13.3333 5.72833 12.8242 4.57475 11.9999 3.73366L11.1667 4.55021C11.7858 5.18207 12.1666 6.04581 12.1666 6.99967H13.3333ZM6.33329 3.49968H8.08329V2.33301H6.33329V3.49968ZM2.83329 6.99967C2.83329 5.06668 4.4003 3.49968 6.33329 3.49968V2.33301C3.75596 2.33301 1.66663 4.42234 1.66663 6.99967H2.83329ZM1.66663 6.99967C1.66663 8.27099 2.17578 9.42459 2.99999 10.2657L3.83327 9.44915C3.21409 8.81728 2.83329 7.95354 2.83329 6.99967H1.66663Z"
    />
  </svg>
)

const PostClaimContainer = ({ children }: { children: ReactNode }) => (
  <Card borderColor="gray" padding="medium" shadow="soft">
    <div className="flex flex-col items-center justify-center gap-y-3">
      {children}
    </div>
  </Card>
)

type EmailState = 'initial' | 'sent' | 'failed'

const { discordUrl } = hemiSocials

export const WelcomePack = function () {
  const locale = useLocale()
  const t = useTranslations('get-started')

  const { profile } = useQueryParams<{ profile: Profile }>().queryParams

  const { executeRecaptcha, loaded: recaptchaLoaded } = useReCaptcha()

  const [email, setEmail] = useState('')
  const [receiveUpdates, setReceiveUpdates] = useState(false)

  const [emailState, setEmailState] = useState<EmailState>('initial')

  const { isPending: isClaiming, mutate: claimTokens } = useMutation<
    void,
    Error,
    { email: string; profile: Profile; receiveUpdates: boolean }
  >({
    mutationFn: async function claimTokens(body) {
      const token = await executeRecaptcha('claim_tokens')

      return fetch(`${process.env.NEXT_PUBLIC_CLAIM_TOKENS_URL}/claim`, {
        body: JSON.stringify({
          ...body,
          token,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    },
    onError() {
      setEmailState('failed')
    },
    onSuccess() {
      setEmailState('sent')
    },
  })

  const canClaim = !isClaiming && recaptchaLoaded && EmailRegex.test(email)

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (!canClaim) {
      return
    }
    claimTokens({ email, profile, receiveUpdates })
  }

  const onTryAgain = function () {
    setEmailState('initial')
    setEmail('')
  }

  const linksCss =
    'cursor-pointer underline text-blue-600 hover:text-blue-800 visited:text-purple-600'

  const submitButton = (
    <Button disabled={!canClaim} type="submit" variant="tertiary">
      {t(isClaiming ? 'network.claiming' : 'network.claim-my-tokens')}
    </Button>
  )

  return (
    <>
      <h4 className="w-full text-xl font-medium text-slate-900">
        {t('network.welcome-pack')}
      </h4>
      <p className="pt-2 text-sm text-slate-500">
        {t('network.welcome-pack-description')}
      </p>
      <div className="flex flex-col gap-y-2 py-8">
        {giveAwayTokens.map(({ amount, icon, symbol }) => (
          <CoinRow amount={amount} icon={icon} key={symbol} symbol={symbol} />
        ))}
      </div>
      {emailState === 'initial' && (
        <>
          <form className="flex flex-col gap-y-3" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-solid border-slate-100 px-3 py-3 text-base font-medium text-slate-900 placeholder:opacity-30 lg:py-4 lg:pr-24"
                onChange={e => setEmail(e.target.value)}
                placeholder="joe@email.com"
                type="email"
                value={email}
              />
              <div className="absolute right-3 top-2 hidden lg:block [&>button]:h-fit [&>button]:w-fit [&>button]:px-3 [&>button]:py-2">
                {submitButton}
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <input
                checked={receiveUpdates}
                className="cursor-pointer border-gray-300 bg-gray-100 text-orange-950 accent-orange-950 focus:ring-2 focus:ring-orange-950"
                id="receive-updates-checkbox"
                onChange={e => setReceiveUpdates(e.target.checked)}
                placeholder={t('network.email-placeholder')}
                type="checkbox"
              />
              <label
                className="cursor-pointer text-xs text-zinc-500"
                htmlFor="receive-updates-checkbox"
              >
                {t('network.receive-updates')}
              </label>
            </div>
            <div className="lg:hidden">{submitButton}</div>
            <div className="text-xs text-neutral-400">
              {/* See https://developers.google.com/recaptcha/docs/faq#id-like-to-hide-the-recaptcha-badge.-what-is-allowed */}
              {t.rich('network.recaptcha-terms-and-conditions', {
                privacy: (chunk: string) => (
                  <ExternalLink
                    className={linksCss}
                    href={`https://policies.google.com/privacy?hl=${locale}`}
                  >
                    {chunk}
                  </ExternalLink>
                ),
                terms: (chunk: string) => (
                  <ExternalLink
                    className={linksCss}
                    href={`https://policies.google.com/terms?hl=${locale}`}
                  >
                    {chunk}
                  </ExternalLink>
                ),
              })}
            </div>
          </form>
        </>
      )}
      {emailState === 'sent' && (
        <PostClaimContainer>
          <div className="flex items-center gap-x-1">
            <EmailIcon />
            <p className="text-xs text-green-600">{t('network.email-sent')}</p>
          </div>
          <div className="flex items-center gap-x-1">
            <ResetIcon />
            <p className="text-xs text-slate-400">
              {t.rich('network.did-not-receive-try-again', {
                button: (chunk: string) => (
                  <button
                    className="font-semibold underline"
                    onClick={onTryAgain}
                  >
                    {chunk}
                  </button>
                ),
              })}
            </p>
          </div>
        </PostClaimContainer>
      )}
      {emailState === 'failed' && (
        <PostClaimContainer>
          <div className="flex items-center gap-x-1">
            <ErrorIcon />
            <p className="flex-shrink text-xs text-red-600">
              {t('network.email-failed')}
            </p>
          </div>
          <p className="flex-shrink text-center text-xs text-slate-400">
            {t.rich('network.email-failed-retry', {
              button: (chunk: string) => (
                <button
                  className="font-medium text-slate-950 underline"
                  onClick={onTryAgain}
                >
                  {chunk}
                </button>
              ),
              discord: () => <DiscordIcon />,
              link: (chunk: string) => (
                <ExternalLink
                  className="cursor-pointer font-medium text-slate-950 underline"
                  href={discordUrl}
                >
                  {chunk}
                </ExternalLink>
              ),
            })}
          </p>
        </PostClaimContainer>
      )}
    </>
  )
}
