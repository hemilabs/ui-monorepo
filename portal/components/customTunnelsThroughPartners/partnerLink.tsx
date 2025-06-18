import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { ReactNode } from 'react'

export const PartnerLink = ({
  icon,
  text,
  url,
}: {
  icon: ReactNode
  text: string
  url: string
}) => (
  <ExternalLink
    className="group/link shadow-soft flex w-full items-center gap-x-1 rounded-xl border border-solid border-neutral-300/55
        bg-white p-3 text-base font-medium text-neutral-950 transition-colors duration-200 hover:bg-neutral-50"
    href={url}
  >
    {icon}
    <span className="mr-auto">{text}</span>
    <ArrowDownLeftIcon className="[&>path]:fill-neutral-500 [&>path]:transition-colors [&>path]:duration-200 group-hover/link:[&>path]:fill-neutral-950" />
  </ExternalLink>
)
