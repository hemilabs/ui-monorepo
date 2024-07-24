import { ExternalLink } from 'components/externalLink'
import Link from 'next-intl/link'
import React from 'react'

type NavRouterItemProps = {
  href?: string
  children: React.ReactNode
  isExternal?: boolean
}

export const NavRouterItem = function ({
  href,
  children,
  isExternal = false,
}: NavRouterItemProps) {
  if (!href) {
    return <>{children}</>
  }

  if (isExternal) {
    return <ExternalLink href={href}>{children}</ExternalLink>
  }

  return <Link href={href}>{children}</Link>
}
