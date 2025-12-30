'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { EvmToken } from 'types/token'
import { tunnelsThroughPartners } from 'utils/token'

type Props = {
  canWithdraw: boolean
  isWithdrawing: boolean
  fromToken: EvmToken
  setIsPartnersDrawerOpen: (isOpen: boolean) => void
  validationError: string | undefined
}

export const SubmitEvmWithdrawal = function ({
  canWithdraw,
  fromToken,
  isWithdrawing,
  setIsPartnersDrawerOpen,
  validationError,
}: Props) {
  const t = useTranslations()

  if (tunnelsThroughPartners(fromToken)) {
    return (
      <Button
        onClick={() => setIsPartnersDrawerOpen(true)}
        size="xLarge"
        type="button"
      >
        {t('tunnel-page.tunnel-partners.tunnel-with-our-partners')}
      </Button>
    )
  }

  return (
    <SubmitWhenConnected
      submitButton={
        validationError ? (
          <Button disabled size="xLarge" type="button">
            {validationError}
          </Button>
        ) : (
          <Button
            disabled={!canWithdraw || isWithdrawing}
            size="xLarge"
            type="submit"
          >
            {t(
              `tunnel-page.submit-button.${
                isWithdrawing ? 'withdrawing' : 'initiate-withdrawal'
              }`,
            )}
          </Button>
        )
      }
    />
  )
}
