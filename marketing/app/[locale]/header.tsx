'use client'

import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import { DesktopLogo } from 'ui-common/components/logo'

const DiscordLogo = () => (
  <svg fill="none" height={32} width={33} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#a)">
      <path
        d="M27.59 5.54a26.39 26.39 0 0 0-6.514-2.02.099.099 0 0 0-.105.05c-.281.5-.593 1.153-.81 1.666a24.362 24.362 0 0 0-7.317 0 16.863 16.863 0 0 0-.823-1.666.103.103 0 0 0-.105-.05 26.315 26.315 0 0 0-6.513 2.02.093.093 0 0 0-.043.037C1.21 11.775.075 17.821.632 23.791a.11.11 0 0 0 .042.075 26.54 26.54 0 0 0 7.99 4.04.104.104 0 0 0 .113-.038 18.959 18.959 0 0 0 1.634-2.659.101.101 0 0 0-.055-.14c-.87-.33-1.7-.733-2.496-1.19a.103.103 0 0 1-.01-.17c.167-.126.335-.257.495-.389a.099.099 0 0 1 .104-.014c5.237 2.391 10.906 2.391 16.082 0a.099.099 0 0 1 .104.013c.16.132.328.264.497.39a.103.103 0 0 1-.009.17 16.4 16.4 0 0 1-2.497 1.188.102.102 0 0 0-.054.142c.48.931 1.029 1.817 1.633 2.658.025.036.07.05.113.038a26.451 26.451 0 0 0 8.003-4.039.103.103 0 0 0 .041-.074c.667-6.902-1.117-12.898-4.731-18.213a.082.082 0 0 0-.042-.039ZM11.192 20.156c-1.576 0-2.875-1.448-2.875-3.226 0-1.777 1.273-3.225 2.875-3.225 1.615 0 2.901 1.46 2.876 3.225 0 1.778-1.274 3.226-2.876 3.226Zm10.633 0c-1.576 0-2.875-1.448-2.875-3.226 0-1.777 1.273-3.225 2.875-3.225 1.615 0 2.901 1.46 2.876 3.225 0 1.778-1.261 3.226-2.876 3.226Z"
        fill="#999"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path d="M.5 0h32v32H.5z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)

const XLogo = () => (
  <svg fill="none" height={32} width={33} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.936 2.539h4.498l-9.827 11.23 11.56 15.284h-9.051l-7.09-9.269-8.112 9.27h-4.5l10.51-12.014L1.834 2.539h9.282l6.408 8.472 7.412-8.472ZM23.357 26.36h2.492L9.761 5.089H7.087l16.27 21.272Z"
      fill="#999"
    />
  </svg>
)

export const Header = function () {
  const t = useTranslations()
  const navigationItemCss = 'py-4 text-neutral-400'

  return (
    <header className="mx-auto hidden overflow-x-auto md:block md:w-5/6 lg:w-4/5 xl:w-11/12 2xl:max-w-[1650px]">
      <nav>
        <ul className="flex items-center justify-between font-medium md:gap-x-2 lg:gap-x-4 xl:gap-x-8">
          <li className={`mr-auto ${navigationItemCss}`}>
            <Link className="block w-32 cursor-pointer" href="./">
              <DesktopLogo />
            </Link>
          </li>
          <li className={navigationItemCss}>
            <Link className="cursor-pointer" href="/network">
              {t('header.network')}
            </Link>
          </li>
          <li className={navigationItemCss}>
            <a className="cursor-pointer">{t('header.documentation')}</a>
          </li>
          <li className={navigationItemCss}>
            <a className="cursor-pointer">{t('home.tunnel-and-swap')}</a>
          </li>
          <li className={`ml-auto ${navigationItemCss}`}>
            <a className="cursor-pointer">
              <DiscordLogo />
            </a>
          </li>
          <li className={navigationItemCss}>
            <a className="cursor-pointer">
              <XLogo />
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
