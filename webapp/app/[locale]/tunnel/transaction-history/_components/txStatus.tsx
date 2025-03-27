import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-x-1.5">{children}</div>
)

const Dot = ({ className }: { className: string }) => (
  <div
    className={`h-1.5 w-1.5 rounded-full border border-solid ${className}`}
  />
)

const Failed = function () {
  const t = useTranslations()
  return (
    <Container>
      <Dot className="border-rose-950/25 bg-rose-500" />
      <span className="text-xs font-medium text-rose-500">
        {t('common.failed')}
      </span>
    </Container>
  )
}

const InStatus = ({ text }: { text: ReactNode }) => (
  <Container>
    <Dot className="border-amber-800/25 bg-amber-400" />
    <span className="text-amber-600">{text}</span>
  </Container>
)

const Success = function () {
  const t = useTranslations()
  return (
    <Container>
      <Dot className="border-emerald-900/25 bg-emerald-500" />
      <span className="text-emerald-500">{t('common.success')}</span>
    </Container>
  )
}

const Finished = ({ text }: { text: string }) => (
  <Container>
    <Dot className="border-neutral-800/25 bg-neutral-500" />
    <span className="text-neutral-500">{text}</span>
  </Container>
)

export const TxStatus = {
  Failed,
  Finished,
  InStatus,
  Success,
}
