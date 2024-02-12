'use client'

import { useTranslations } from 'next-intl'
import { FormEvent } from 'react'
import { Button } from 'ui-common/components/button'

// TODO should probably be moved into a config?
const BvmTokens = 200
const BtcTokens = 0.0012
// TODO should probably be moved into a config?

const CoinRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-x-2 py-3">
    {icon}
    <p>{text}</p>
  </div>
)

export const WelcomePack = function () {
  const t = useTranslations()

  const claimTokens = function (e: FormEvent) {
    e.preventDefault()
    // TODO https://github.com/BVM-priv/ui-monorepo/issues/45
  }
  return (
    <>
      <h4 className="text-xl font-medium">{t('network.your-welcome-pack')}</h4>
      <p className="pt-3 text-sm text-neutral-400">
        {t('network.welcome-pack-description')}
      </p>
      <CoinRow
        icon={
          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-red-400 to-indigo-500" />
        }
        text={t('network.amount-of-tokens', {
          amount: BvmTokens,
          symbol: 'BVM',
        })}
      />
      <CoinRow
        icon={
          <svg
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
              fill="#F7931A"
            />
            <path
              d="M17.392 10.515C17.6275 8.943 16.4298 8.09775 14.7933 7.53375L15.3243 5.40375L14.0283 5.08125L13.5108 7.155C13.1703 7.0695 12.8208 6.99 12.472 6.9105L12.9933 4.82325L11.6973 4.5L11.1663 6.62925C10.8843 6.56475 10.6068 6.50175 10.3383 6.43425L10.3398 6.4275L8.55179 5.98125L8.20679 7.36575C8.20679 7.36575 9.16904 7.58625 9.14879 7.59975C9.67379 7.731 9.76829 8.07825 9.75254 8.35425L9.14804 10.7805C9.18404 10.7895 9.23054 10.803 9.28304 10.8232L9.14579 10.7895L8.29829 14.1885C8.23379 14.3475 8.07104 14.5867 7.70354 14.496C7.71704 14.5147 6.76154 14.2612 6.76154 14.2612L6.11804 15.7448L7.80554 16.1655C8.11904 16.2443 8.42654 16.3267 8.72879 16.404L8.19254 18.558L9.48779 18.8805L10.0188 16.7505C10.3728 16.8457 10.7163 16.9342 11.0523 17.0182L10.5228 19.1392L11.8188 19.4618L12.355 17.3123C14.566 17.7308 16.228 17.562 16.9278 15.5625C17.4918 13.953 16.9 13.0238 15.7368 12.4185C16.5843 12.2235 17.2218 11.6663 17.392 10.515ZM14.4295 14.6685C14.0298 16.2788 11.3185 15.408 10.4395 15.1898L11.152 12.336C12.031 12.5557 14.8488 12.99 14.4295 14.6685ZM14.8308 10.4918C14.4655 11.9565 12.2095 11.2118 11.4783 11.0295L12.1233 8.442C12.8545 8.62425 15.2118 8.964 14.8308 10.4918Z"
              fill="white"
            />
          </svg>
        }
        text={t('network.amount-of-tokens', {
          amount: BtcTokens,
          symbol: 'sBTC',
        })}
      />
      <form onSubmit={claimTokens}>
        <Button type="submit">{t('network.claim-my-tokens')}</Button>
      </form>
    </>
  )
}
