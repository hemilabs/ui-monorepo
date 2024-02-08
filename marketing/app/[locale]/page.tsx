'use client'

import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'

const Home = function () {
  const t = useTranslations('home')

  return (
    <main className="flex-grow">
      <section className="bg-triangles-pattern flex h-full flex-col items-center gap-y-5 rounded-3xl bg-cover px-2 sm:px-5 2xl:px-8">
        <h1
          className="font-right-grotesk mt-14 flex text-left text-2xl font-black uppercase text-[#F3EDE4] sm:text-4xl md:text-center xl:text-6xl 2xl:text-8xl"
          dangerouslySetInnerHTML={{ __html: t.raw('page-title') }}
        />
        <p
          className="text-left text-sm font-normal text-white md:text-center 2xl:text-xl"
          dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}
        ></p>
        <div className="mt-12 flex w-full flex-col gap-x-4 gap-y-4 md:flex-row md:justify-center">
          <Link
            className='className="w-full md:w-auto" rounded-xl bg-blue-500 px-7 py-[13px] text-xs font-semibold text-white sm:text-base'
            href="/network"
          >
            {t('get-started')}
          </Link>
          <button className="w-full rounded-xl bg-white px-7 py-[13px] text-xs font-semibold text-teal-900 sm:text-base md:w-auto">
            {t('tunnel-and-swap')}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Home
