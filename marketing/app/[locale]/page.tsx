'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import { useState } from 'react'
import { Card } from 'ui-common/components/card'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'

const Modal = dynamic(
  () => import('ui-common/components/modal').then(mod => mod.Modal),
  {
    ssr: false,
  },
)

type ChoosePathProps = {
  onClose: () => void
}

const CloseIcon = dynamic(
  () => import('ui-common/components/closeIcon').then(mod => mod.CloseIcon),
  {
    ssr: false,
  },
)

const Path = ({
  imageSrc,
  path,
  text,
  title,
}: {
  imageSrc: string
  path: 'developer' | 'miner' | 'individuals'
  text: string
  title: string
}) => (
  <Link
    className="cursor-pointer"
    href={{ pathname: '/network', query: { path } }}
  >
    <Card>
      <div className="flex flex-row justify-between gap-x-4 md:w-48 md:flex-col md:gap-y-2">
        <div className="relative h-24 w-44 md:h-28 md:w-full">
          <Image
            alt="documentation background image"
            className="rounded-lg object-cover"
            fill
            src={imageSrc}
          />
        </div>
        <div className="flex flex-shrink flex-col md:gap-y-2 md:text-center">
          <h5 className="h-fit text-base font-bold md:text-lg">{title}</h5>
          <p className="text-sm font-normal text-zinc-500 lg:text-base">
            {text}
          </p>
        </div>
      </div>
    </Card>
  </Link>
)

const Paths = function ({ onClose }: ChoosePathProps) {
  const t = useTranslations('home')
  return (
    <>
      <div className="mb-7 flex items-center justify-between md:mb-10 md:justify-end">
        <h3 className="text-3xl font-bold md:mx-auto md:text-5xl">
          {t('choose-your-path')}
        </h3>
        <CloseIcon height={32} onClick={onClose} width={32} />
      </div>
      <div className="flex flex-col gap-y-4 md:flex-row md:gap-x-5 xl:gap-x-6">
        <Path
          imageSrc="/developer-path.jpeg"
          path="developer"
          text={t('developer-path')}
          title={t('i-am-a-developer')}
        />
        <Path
          imageSrc="/miner-path.jpeg"
          path="miner"
          text={t('miner-path')}
          title={t('i-am-a-miner')}
        />
        <Path
          imageSrc="/individuals-path.jpeg"
          path="individuals"
          text={t('individuals-path')}
          title={t('individuals')}
        />
      </div>
    </>
  )
}

const ChoosePathDesktop = ({ onClose }: ChoosePathProps) => (
  <Modal onClose={onClose}>
    <div className="flex flex-col rounded-xl bg-neutral-100 p-14">
      <Paths onClose={onClose} />
    </div>
  </Modal>
)

const ChoosePathMobile = ({ onClose }: ChoosePathProps) => (
  <>
    <div
      className="fixed bottom-0 left-0 right-0 top-0 z-20 bg-neutral-200/30 backdrop-blur-md backdrop-filter"
      onClick={onClose}
    ></div>
    <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col rounded-xl bg-neutral-100 p-4 sm:p-5">
      <Paths onClose={onClose} />
    </div>
  </>
)

// From https://tailwindcss.com/docs/screens
const mdBreakpoint = 768
const ChoosePath = function ({ onClose }: ChoosePathProps) {
  const { width } = useWindowSize()
  return (
    <>
      {/* Not using tailwind here because Desktop renders a modal inside a React's Portal.
      So we can't target it with a css's "hidden" class because the modal html is not a children of this component. */}
      {width >= mdBreakpoint ? (
        <ChoosePathDesktop onClose={onClose} />
      ) : (
        <ChoosePathMobile onClose={onClose} />
      )}
    </>
  )
}
const Home = function () {
  const t = useTranslations('home')
  const [showChoosePath, setShowChoosePath] = useState(false)

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
          <button
            className={`${linksCommonCss} bg-blue-500 text-white`}
            onClick={() => setShowChoosePath(true)}
          >
            {t('get-started')}
          </button>
          <a className={`${linksCommonCss} bg-white text-teal-900`}>
            {t('tunnel-and-swap')}
          </a>
        </div>
      </section>
      {showChoosePath && (
        <ChoosePath onClose={() => setShowChoosePath(false)} />
      )}
    </main>
  )
}

export default Home
