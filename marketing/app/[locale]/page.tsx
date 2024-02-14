'use client'

import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'

const Home = function () {
  const t = useTranslations('home')

  const linksCommonCss =
    'w-full rounded-xl px-7 py-3 font-semibold text-center text-xs sm:text-base md:w-auto cursor-pointer'

  return (
    <main className="h-fit-rest-screen-mobile md:h-fit-rest-screen-desktop md:pb-11">
      <section className="bg-triangles-pattern flex h-full flex-col items-center gap-y-5 rounded-3xl bg-cover px-4 pb-10 pt-12 sm:px-5 md:pt-24 2xl:px-8">
        <h1
          className="font-right-grotesk flex text-left text-5xl font-black uppercase leading-[64px] text-[#F3EDE4] md:text-center lg:text-6xl xl:text-8xl"
          dangerouslySetInnerHTML={{ __html: t.raw('page-title') }}
        />
        <p
          className="text-left text-base font-normal leading-7 text-white md:text-center 2xl:text-xl"
          dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}
        ></p>
        <div className="mt-auto flex w-full flex-col gap-x-4 gap-y-4 md:mt-14 md:flex-row md:justify-center">
          <Link
            className={`${linksCommonCss} bg-blue-500 text-white`}
            href="/network"
          >
            {t('get-started')}
          </Link>
          <a className={`${linksCommonCss} bg-white text-teal-900`}>
            {t('tunnel-and-swap')}
          </a>
        </div>
      </section>
    </main>
  )
}

export default Home
