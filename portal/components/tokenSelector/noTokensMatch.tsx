import { useTranslations } from 'use-intl'

type Props = {
  searchText: string
}

export const NoTokensMatch = function ({ searchText }: Props) {
  const t = useTranslations('token-selector')
  return (
    <span className="text-center text-sm font-medium text-neutral-500">
      {t.rich('no-results-for', {
        search: () => <span className="text-neutral-950">{searchText}</span>,
      })}
    </span>
  )
}
