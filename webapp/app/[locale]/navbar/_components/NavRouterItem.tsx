import Link from 'next/link'
import React from 'react'

type NavRouterItemProps = {
  href?: string
  children: React.ReactNode
  isExternal?: boolean
  locale: string
}

export function NavRouterItem({
  href,
  children,
  isExternal = false,
  locale,
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

  const localizedHref = `/${locale}${href}`
  return <Link href={localizedHref}>{children}</Link>
}
