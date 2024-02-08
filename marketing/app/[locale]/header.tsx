'use client'

import { useTranslations } from 'next-intl'

export const Header = function () {
  const t = useTranslations()
  return (
    <header className="mb-6 overflow-x-auto">
      <div>
        <nav>
          <ul className="flex justify-between gap-x-4 font-medium">
            <li className="self-start py-4 pr-5">
              <a className="cursor-pointer">Logo</a>
            </li>
            <div className="flex w-full justify-center">
              <li className="px-5 py-4 text-neutral-400">
                <a className="cursor-pointer">{t('header.network')}</a>
              </li>
              <li className="px-5 py-4 text-neutral-400">
                <a className="cursor-pointer">{t('header.documentation')}</a>
              </li>
              <li className="py-4 pl-5 text-neutral-400">
                <a className="cursor-pointer">{t('home.tunnel-and-swap')}</a>
              </li>
            </div>
          </ul>
        </nav>
      </div>
    </header>
  )
}
