import { ExternalLink } from 'components/externalLink'
import { Chevron } from 'components/icons/chevron'
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
    className="group/link shadow-soft flex w-full items-center gap-x-1 rounded-xl border border-solid
        border-neutral-300/55 p-4 text-base font-medium text-neutral-950 hover:bg-neutral-50"
    href={url}
  >
    {icon}
    <span className="mr-auto">{text}</span>
    <Chevron.Right className="[&>path]:fill-neutral-500 group-hover/link:[&>path]:fill-neutral-950" />
  </ExternalLink>
)
