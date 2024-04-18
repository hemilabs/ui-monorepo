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
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    )
  }

  return <Link href={href}>{children}</Link>
}
