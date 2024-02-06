'use client'

import { useTranslations } from 'next-intl'

const Home = function () {
  const t = useTranslations('home')
  return (
    <>
      <header className="mb-6 overflow-x-auto">
        <div>
          <nav>
            <ul className="flex gap-x-4 font-medium">
              <li className="mr-auto py-4 pr-5">
                <a className="cursor-pointer">Logo</a>
              </li>
              <li className="px-5 py-4 text-neutral-400">
                <a className="cursor-pointer">{t('network')}</a>
              </li>
              <li className="px-5 py-4 text-neutral-400">
                <a className="cursor-pointer">{t('documentation')}</a>
              </li>
              <li className="py-4 pl-5 text-neutral-400">
                <a className="cursor-pointer">{t('tunnel-and-swap')}</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        <section className="bg-triangles-pattern flex h-full flex-col items-center gap-y-5 bg-cover px-2 sm:rounded-3xl sm:px-5 2xl:px-8">
          <h1
            className="font-right-grotesk mt-14 flex text-center text-2xl font-black uppercase text-[#F3EDE4] sm:text-4xl xl:text-6xl 2xl:text-8xl"
            dangerouslySetInnerHTML={{ __html: t.raw('page-title') }}
          />
          <p
            className="text-center text-sm font-normal text-white 2xl:text-xl"
            dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}
          ></p>
          <div className="mt-12 flex gap-x-4">
            <button className="rounded-xl bg-[#F16063] px-7 py-[13px] text-xs font-semibold text-white sm:text-base">
              {t('get-started')}
            </button>
            <button className="rounded-xl bg-white px-7 py-[13px] text-xs font-semibold text-teal-900 sm:text-base">
              {t('tunnel-and-swap')}
            </button>
          </div>
        </section>
      </main>
    </>
  )
}

export default Home
