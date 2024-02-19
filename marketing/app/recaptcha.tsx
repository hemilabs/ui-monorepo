'use client'

import { useLocale } from 'next-intl'
import { ReCaptchaProvider } from 'next-recaptcha-v3'

if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  throw new Error('NEXT_PUBLIC_RECAPTCHA_SITE_KEY env variable is not set')
}

type Props = {
  children: React.ReactNode
}
// While it is not entirely clear from the docs, it seems google recommends adding recaptcha
// in all pages, so it learns better from users to then  improve the scoring
// https://developers.google.com/recaptcha/docs/v3#placement_on_your_website
// The rest of internet seems to mostly agree with this (of injecting it everywhere)
export const RecaptchaContext = function ({ children }: Props) {
  const locale = useLocale()
  return <ReCaptchaProvider language={locale}>{children}</ReCaptchaProvider>
}
