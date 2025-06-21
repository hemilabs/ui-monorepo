import { ExternalLink } from 'components/externalLink'
import { ReactNode } from 'react'

import { PartnerLinkArrowIcon } from './_icons/partnerLinkArrowIcon'

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
    className="group/link flex w-full items-center gap-x-1 rounded-xl border border-solid border-neutral-300/55 bg-white
        p-3 text-base font-medium text-neutral-950 shadow-sm transition-all duration-200 hover:bg-neutral-50 hover:shadow"
    href={url}
  >
    {icon}
    <span className="mr-auto">{text}</span>
    <PartnerLinkArrowIcon className="[&>path]:fill-neutral-400 [&>path]:transition-colors [&>path]:duration-200 group-hover/link:[&>path]:fill-neutral-950" />
  </ExternalLink>
)
