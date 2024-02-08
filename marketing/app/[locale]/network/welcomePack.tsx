'use client'

import { useTranslations } from 'next-intl'
import { FormEvent } from 'react'
import { Button } from 'ui-common/components/button'

// TODO should probably be moved into a config?
const BvmTokens = 200
const BtcTokens = 0.0012
// TODO should probably be moved into a config?

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
      <div className="flex items-center py-3">
        {/* TODO update logos */}
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-red-400 to-indigo-500" />
        <p>
          {t('network.amount-of-tokens', {
            amount: BvmTokens,
            symbol: 'BVM',
          })}
        </p>
      </div>
      <div className="flex items-center py-3">
        {/* TODO update logos */}
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-red-400 to-indigo-500" />
        <p>
          {t('network.amount-of-tokens', {
            amount: BtcTokens,
            symbol: 'sBTC',
          })}
        </p>
      </div>
      <form onSubmit={claimTokens}>
        <Button type="submit">{t('network.claim-my-tokens')}</Button>
      </form>
    </>
  )
}
