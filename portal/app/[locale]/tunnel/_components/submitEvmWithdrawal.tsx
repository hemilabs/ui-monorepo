'use client'

import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
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
        fontSize="text-mid"
        onClick={() => setIsPartnersDrawerOpen(true)}
        type="button"
      >
        {t('tunnel-page.tunnel-partners.tunnel-with-our-partners')}
      </Button>
    )
  }

  return (
    <SubmitWhenConnectedToChain
      chainId={fromToken.chainId}
      submitButton={
        validationError ? (
          <Button disabled fontSize="text-mid" type="button">
            {validationError}
          </Button>
        ) : (
          <Button
            disabled={!canWithdraw || isWithdrawing}
            fontSize="text-mid"
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
