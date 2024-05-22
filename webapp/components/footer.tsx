import React from 'react'

import { FooterSocials } from './footerSocials'
import { SmallHemiIcon } from './icons/smallHemiIcon'
import { Text } from './text'

export const Footer = () => (
  <div
    className={`bg-hemi-color-footer flex w-full justify-between gap-6 
    rounded-bl-3xl rounded-br-3xl border-y 
    border-slate-200 border-opacity-50 px-9 py-4`}
  >
    <div className="flex select-none items-center">
      <div className="mr-1">
        <SmallHemiIcon className="text-slate-200" />
      </div>
      <Text className="text-slate-200" size="18">
        hemi
      </Text>
    </div>
    <FooterSocials />
  </div>
)
