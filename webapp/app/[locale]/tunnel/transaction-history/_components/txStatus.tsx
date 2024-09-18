import { useTranslations } from 'next-intl'

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-x-1.5">{children}</div>
)

const Failed = function () {
  const t = useTranslations()
  return (
    <Container>
      <svg
        fill="none"
        height="13"
        viewBox="0 0 13 13"
        width="13"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.35693 2.7002L10.3569 9.7002M10.3569 2.7002L3.35693 9.7002"
          stroke="#FF3232"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-medium text-green-600">
        {t('common.failed')}
      </span>
    </Container>
  )
}

const InStatus = ({ text }: { text: string }) => (
  <Container>
    <div
      className="h-1.5 w-1.5 rounded-full border border-solid
        border-amber-800/25 bg-amber-400"
    />
    <span className="text-[#F59E0B]">{text}</span>
  </Container>
)

const Success = function () {
  const t = useTranslations()
  return (
    <Container>
      <div
        className="h-1.5 w-1.5 rounded-full border border-solid
        border-emerald-900/25 bg-emerald-500"
      />
      <span className="text-emerald-500">{t('common.success')}</span>
    </Container>
  )
}

export const TxStatus = {
  Failed,
  InStatus,
  Success,
}
