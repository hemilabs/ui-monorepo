import { useTranslations } from 'next-intl'

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-x-1 text-xs">{children}</div>
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
    <svg
      fill="none"
      height="13"
      viewBox="0 0 13 13"
      width="13"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="stroke-orange-600"
        d="M3 10.75V9.125C3 8.9179 3.1679 8.75 3.375 8.75H4.875M10.0059 2.75V4.375C10.0059 4.58211 9.83805 4.75 9.6309 4.75H8.0059M2.5 6.75C2.5 4.54086 4.29086 2.75 6.5 2.75C7.8181 2.75 9.01515 3.38756 9.75 4.37112M10.5 6.75C10.5 8.95915 8.70915 10.75 6.5 10.75C5.18189 10.75 3.98485 10.1125 3.25 9.1289"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="text-orange-600">{text}</span>
  </Container>
)

const Success = function () {
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
          d="M3 7.125L5.5 10.25L10 3.25"
          stroke="#10A732"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-medium text-green-600">
        {t('common.success')}
      </span>
    </Container>
  )
}

export const TxStatus = {
  Failed,
  InStatus,
  Success,
}
