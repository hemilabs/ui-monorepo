import React from 'react'

import { Footer } from './footer'
import { Header } from './header'

type AppScreenProps = {
  children: React.ReactNode
  locale: string
}

export const AppScreen = ({ children, locale }: AppScreenProps) => (
  <div
    className={`bg-hemi-layout bg-hemi-color-layout shadow-hemi-layout backdrop-blur-20 
    ml-[21px] mr-[9px] mt-[14px] flex h-[97vh] flex-1 
    flex-col self-stretch 
    rounded-[24px] border border-[#E5E6E6] px-5 pb-3 pt-3 md:pb-0`}
  >
    <Header locale={locale} />
    <div className="max-h-[calc(100vh-1rem)] flex-grow overflow-auto pr-5">
      {children}
    </div>
    <div className="mx-[-21px] mb-[-1px] mt-auto hidden pt-3 md:block">
      <Footer locale={locale} />
    </div>
  </div>
)
