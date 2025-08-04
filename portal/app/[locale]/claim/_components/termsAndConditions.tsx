import { useMutation } from '@tanstack/react-query'
import { Button } from 'components/button'
import { Modal } from 'components/modal'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { FormEvent } from 'react'
import { Hash } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

// TODO This message needs to be defined by legal
const SigningMessage = 'I have read and accept the T&C of HEMI tokens'

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
    onSuccess: (signedMessage: Hash) => onAccept(signedMessage),
  })

  const disableSubmit = status === 'pending'

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    signTermsAndConditions()
  }

  return (
    <Modal onClose={onClose}>
      <div className="max-w-120 relative w-full bg-neutral-50">
        <div className="shadow-claim-page-high relative z-10 rounded-lg bg-white">
          <h3 className="px-6 py-4 text-lg font-semibold  text-neutral-950">
            {t('rewards-page.terms-and-conditions.title')}
          </h3>
          <div className="h-px w-full border-b border-solid border-b-neutral-300/55" />
          <p className="h-80 p-6 text-sm font-normal text-neutral-500">
            {t('rewards-page.terms-and-conditions.terms')}
          </p>
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
