import { useMutation } from '@tanstack/react-query'
import { Button } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { Modal } from 'components/modal'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { FormEvent } from 'react'
import { Hash } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

// This text is a legal one so we can't translate it
const termsAndConditions = `By clicking "Accept" below, you agree to the {termsAndConditions} of all Hemi websites and represent and warrant that (i) you are not a citizen of, resident in, or formed or qualified to transact business in, the United States or the Peoples Republic of China, (ii) in connection with claiming any Hemi Token you are in compliance with all applicable laws of the jurisdiction in which you reside or are located and of the United States and the Peoples Republic of China, and (iii) neither you nor, to your knowledge, any of your affiliates or direct beneficial owners, (A) appears on any governmental sanctions or similar list,  nor are they otherwise a party with which the Hemi is prohibited to deal under the laws of the United States, (B) is a person identified as a terrorist organization on any other relevant lists maintained by governmental authorities, nor is a senior foreign political figure, or any immediate family member or close associate of a senior foreign political figure, and (C) by claiming Hemi tokens will not be in violation of applicable U.S. federal or state or non-U.S. laws or regulations, including, without limitation, anti-money laundering, economic sanctions, anti-bribery or anti-boycott laws or regulations.`

// The signing message needs to be a plain string...
const SigningMessage = termsAndConditions.replace(
  '{termsAndConditions}',
  'Terms & Conditions (https://hemi.xyz/terms-of-service)',
)
// but the UI needs to display the link to the T&C
const LegalText = function () {
  const [before, after] = termsAndConditions.split('{termsAndConditions}')

  return (
    <p
      className="h-80 overflow-y-auto p-6 text-sm font-normal text-neutral-500"
      style={{
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      {before}
      <ExternalLink
        className="text-orange-500 hover:text-orange-700"
        href="https://hemi.xyz/terms-of-service"
      >
        Terms & Conditions
      </ExternalLink>
      {after}
    </p>
  )
}

type Props = {
  onAccept: (signedTermsAndConditions: Hash) => void
  onClose: VoidFunction
}

export const TermsAndConditions = function ({ onAccept, onClose }: Props) {
  const { address } = useAccount()
  const hemi = useHemi()
  const connectedToHemi = useIsConnectedToExpectedNetwork(hemi.id)
  const { hemiWalletClient } = useHemiWalletClient()
  const t = useTranslations()
  const { switchChainAsync } = useSwitchChain()

  const { mutate: signTermsAndConditions, status } = useMutation({
    async mutationFn() {
      // if the user disconnects the wallet, the whole claim page changes
      // so this component wouldn't even render. So we don't need to handle that scenario
      if (!connectedToHemi) {
        await switchChainAsync({ chainId: hemi.id })
      }

      return hemiWalletClient.signMessage({
        account: address!,
        message: SigningMessage,
      })
    },
    // on error, we close the modal and the user has to start over
    onError: onClose,
    onSuccess: onAccept,
  })

  const disableSubmit = ['pending', 'success'].includes(status)

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    signTermsAndConditions()
  }

  return (
    <Modal onClose={onClose}>
      <div className="max-w-120 relative w-full bg-neutral-50">
        <div className="shadow-claim-page-high relative z-10 rounded-lg bg-white">
          <h3 className="px-6 py-4 text-lg font-semibold  text-neutral-950">
            {t('genesis-drop.terms-and-conditions.title')}
          </h3>
          <div className="h-px w-full border-b border-solid border-b-neutral-300/55" />
          <LegalText />
        </div>
        <form
          className="h-15 relative flex w-full items-center justify-between gap-x-4 rounded-b-xl bg-neutral-50 px-4 [&>button]:w-full"
          onSubmit={handleSubmit}
          style={{
            boxShadow:
              '0 8px 12px -4px rgba(10, 10, 10, 0.08), 0 1px 2px 0 rgba(10, 10, 10, 0.10)',
          }}
        >
          <Button
            disabled={disableSubmit}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            {t('common.cancel')}
          </Button>
          <Button disabled={disableSubmit} type="submit" variant="primary">
            {t('common.accept')}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
