'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  path: '/bridge' | '/swap'
  text: string
}
const Route = function ({ path, text }: Props) {
  const pathname = usePathname()
  const activeLink = 'bg-white text-black cursor-auto'
  const inactiveLink = 'bg-transparent cursor-pointer text-zinc-500'
  return (
    <li
      className={`rounded-2xl px-5 py-3 ${
        pathname === path ? activeLink : inactiveLink
      }`}
    >
      <Link href={path}>{text}</Link>
    </li>
  )
}

export const Header = () => (
  <header className="py-6">
    <nav>
      <ul className="flex w-full justify-center gap-x-4">
        <Route path="/bridge" text="Bridge" />
        <Route path="/swap" text="Swap" />
      </ul>
    </nav>
    {/* I think we should add the Connect Wallet button around here, floating to the right */}
  </header>
)
