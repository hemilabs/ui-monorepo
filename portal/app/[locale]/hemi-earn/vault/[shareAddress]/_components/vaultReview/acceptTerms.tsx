import { Button } from 'components/button'
import { Checkbox } from 'components/checkbox'
import {
  DrawerSection,
  DrawerTopSection,
  useDrawerAnimatedClose,
} from 'components/drawer'
import { ExternalLink } from 'components/externalLink'
import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { type ReactNode, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useTranslations } from 'use-intl'

import {
  vetroPrivacyPolicyUrl,
  vetroTermsUrl,
} from '../../../../_constants/vetro'
import { type HemiEarnTerms } from '../../../../_fetchers/fetchHemiEarnTerms'
import { useAcceptHemiEarnTerms } from '../../../../_hooks/useAcceptHemiEarnTerms'
import { type TermsStep } from '../../../../_utils/termsGate'

const linkClassName = 'hoverable-text font-medium underline'

type PanelProps = {
  children: ReactNode
  footer: ReactNode
  heading: ReactNode
  onClose: VoidFunction
}

const Panel = ({ children, footer, heading, onClose }: PanelProps) => (
  <>
    <div className="mb-3 flex flex-col gap-y-3">
      <DrawerTopSection heading={heading} onClose={onClose} />
    </div>
    <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
      <DrawerSection>{children}</DrawerSection>
    </div>
    <CallToActionContainer>
      <div className="flex w-full flex-col gap-y-4">{footer}</div>
    </CallToActionContainer>
  </>
)

type FormProps = {
  onClose: VoidFunction
  step: Extract<TermsStep, 'first-acceptance' | 're-acceptance'>
  terms: HemiEarnTerms
}

const TermsForm = function ({ onClose, step, terms }: FormProps) {
  const [consentedTo, setConsentedTo] = useState<string | undefined>(undefined)
  const { failure, isPending, mutate } = useAcceptHemiEarnTerms(terms)
  const requestClose = useDrawerAnimatedClose() ?? onClose
  const t = useTranslations('hemi-earn.terms')
  const tCommon = useTranslations('common')

  const accepted = consentedTo === terms.termsVersion
  const hasFailed = failure === 'invalid-signature' || failure === 'unexpected'
  const isReAcceptance = step === 're-acceptance'

  const updatedTermsLink = (chunks: ReactNode) => (
    <ExternalLink className={linkClassName} href={terms.termsUrl}>
      {chunks}
    </ExternalLink>
  )

  const getBody = function () {
    if (isReAcceptance) {
      return (
        <p className="text-sm text-neutral-500">
          {t.rich('re-acceptance.body', { link: updatedTermsLink })}
        </p>
      )
    }
    return (
      <div className="flex flex-col gap-y-3 text-sm text-neutral-500">
        <p>{t('handoff.body')}</p>
        <p>{t('handoff.before-you-continue')}</p>
        <ul className="flex list-disc flex-col gap-y-2 pl-5">
          <li>{t('handoff.bullets.assets')}</li>
          <li>{t('handoff.bullets.yields')}</li>
          <li>{t('handoff.bullets.withdrawals')}</li>
          <li>{t('handoff.bullets.not-available')}</li>
        </ul>
        <p className="flex flex-wrap items-center gap-x-2">
          <ExternalLink className={linkClassName} href={vetroTermsUrl}>
            {t('handoff.terms-of-use')}
          </ExternalLink>
          <span aria-hidden="true">·</span>
          <ExternalLink className={linkClassName} href={vetroPrivacyPolicyUrl}>
            {t('handoff.privacy-policy')}
          </ExternalLink>
        </p>
      </div>
    )
  }

  return (
    <Panel
      footer={
        <>
          <label
            className="flex cursor-pointer items-start gap-x-2"
            htmlFor="accept-vetro-terms"
          >
            <Checkbox
              checked={accepted}
              id="accept-vetro-terms"
              onChange={checked =>
                setConsentedTo(checked ? terms.termsVersion : undefined)
              }
            />
            <span className="text-sm text-neutral-950">{t('checkbox')}</span>
          </label>
          {hasFailed && (
            <p className="text-sm text-rose-500">
              {tCommon('unexpected-error')}
            </p>
          )}
          <div className="flex gap-x-3 [&>button]:flex-1">
            <Button
              onClick={requestClose}
              size="small"
              type="button"
              variant="secondary"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              disabled={!accepted || isPending}
              onClick={() => mutate()}
              size="small"
              type="button"
            >
              {hasFailed ? tCommon('try-again') : t('agree-and-continue')}
            </Button>
          </div>
          <p className="text-xs text-neutral-500">{t('signing-note')}</p>
        </>
      }
      heading={isReAcceptance ? t('re-acceptance.title') : t('handoff.title')}
      onClose={onClose}
    >
      {getBody()}
    </Panel>
  )
}

const TermsNotice = function ({
  message,
  onClose,
}: {
  message: string
  onClose: VoidFunction
}) {
  const requestClose = useDrawerAnimatedClose() ?? onClose
  const t = useTranslations('hemi-earn.vault.drawer')
  const tCommon = useTranslations('common')

  return (
    <Panel
      footer={
        <Button
          onClick={requestClose}
          size="small"
          type="button"
          variant="secondary"
        >
          {tCommon('cancel')}
        </Button>
      }
      heading={t('deposit.heading')}
      onClose={onClose}
    >
      <p className="text-sm text-neutral-500">{message}</p>
    </Panel>
  )
}

const TermsSkeleton = ({ onClose }: { onClose: VoidFunction }) => (
  <Panel
    footer={<Skeleton className="h-10" />}
    heading={<Skeleton className="h-6 w-48" />}
    onClose={onClose}
  >
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4" count={4} />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </Panel>
)

type Props = {
  isError: boolean
  onClose: VoidFunction
  step: TermsStep | undefined
  terms: HemiEarnTerms | undefined
}

export const AcceptTerms = function ({ isError, onClose, step, terms }: Props) {
  const t = useTranslations('hemi-earn.terms')
  const tCommon = useTranslations('common')

  if (terms && (step === 'first-acceptance' || step === 're-acceptance')) {
    return <TermsForm onClose={onClose} step={step} terms={terms} />
  }
  if (step === 'cannot-sign') {
    return <TermsNotice message={t('cannot-sign')} onClose={onClose} />
  }
  if (isError) {
    return (
      <TermsNotice message={tCommon('unexpected-error')} onClose={onClose} />
    )
  }
  return <TermsSkeleton onClose={onClose} />
}
