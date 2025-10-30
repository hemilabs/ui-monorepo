import { Locale } from 'i18n/routing'
import Image, { type StaticImageData } from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { MouseEventHandler } from 'react'

import earnEn from './icons/en.svg'
import earnEs from './icons/es.svg'
import earnPt from './icons/pt.svg'
import merklLogo from './merklLogo.svg'

const CloseButton = ({
  onClick,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>
}) => (
  <button
    className="group/close-button pointer-events-auto absolute right-3.5 top-3 z-10 flex h-5 w-5 items-center justify-center md:opacity-0
    md:transition-opacity md:duration-300 md:group-hover/card-image:visible md:group-hover/card-image:opacity-100"
    onClick={onClick}
    type="button"
  >
    <svg
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="group-hover/close-button:fill-neutral-950"
        d="M5.28 4.22009C5.13783 4.08761 4.94978 4.01549 4.75548 4.01892C4.56118 4.02234 4.37579 4.10106 4.23838 4.23847C4.10097 4.37588 4.02225 4.56127 4.01883 4.75557C4.0154 4.94987 4.08752 5.13792 4.22 5.28009L6.94 8.00009L4.22 10.7201C4.14631 10.7888 4.08721 10.8716 4.04622 10.9636C4.00523 11.0556 3.98319 11.1549 3.98141 11.2556C3.97963 11.3563 3.99816 11.4563 4.03588 11.5497C4.0736 11.6431 4.12974 11.7279 4.20096 11.7991C4.27218 11.8703 4.35702 11.9265 4.4504 11.9642C4.54379 12.0019 4.64382 12.0205 4.74452 12.0187C4.84523 12.0169 4.94454 11.9949 5.03654 11.9539C5.12854 11.9129 5.21134 11.8538 5.28 11.7801L8 9.06009L10.72 11.7801C10.7887 11.8538 10.8715 11.9129 10.9635 11.9539C11.0555 11.9949 11.1548 12.0169 11.2555 12.0187C11.3562 12.0205 11.4562 12.0019 11.5496 11.9642C11.643 11.9265 11.7278 11.8703 11.799 11.7991C11.8703 11.7279 11.9264 11.6431 11.9641 11.5497C12.0018 11.4563 12.0204 11.3563 12.0186 11.2556C12.0168 11.1549 11.9948 11.0556 11.9538 10.9636C11.9128 10.8716 11.8537 10.7888 11.78 10.7201L9.06 8.00009L11.78 5.28009C11.9125 5.13792 11.9846 4.94987 11.9812 4.75557C11.9777 4.56127 11.899 4.37588 11.7616 4.23847C11.6242 4.10106 11.4388 4.02234 11.2445 4.01892C11.0502 4.01549 10.8622 4.08761 10.72 4.22009L8 6.94009L5.28 4.22009Z"
        fill="#737373"
      />
    </svg>
  </button>
)

const PoweredBy = () => (
  <p className="flex items-center gap-1 text-[8px] text-neutral-400">
    {useTranslations('common').rich('powered-by', {
      company: () => (
        <Image alt="Merkle Logo" height={8} src={merklLogo} width={29} />
      ),
    })}
  </p>
)

const imageMap: Record<Locale, StaticImageData> = {
  en: earnEn,
  es: earnEs,
  pt: earnPt,
}

export const EarnRewards = function ({
  onClose,
}: {
  onClose: MouseEventHandler<HTMLButtonElement> | VoidFunction
}) {
  const locale = useLocale()

  const image = imageMap[locale]

  return (
    <div className="group/card-image rounded-xl bg-white shadow-md hover:shadow-lg">
      <div className="p-1.5">
        <div className="relative overflow-hidden rounded-lg">
          <Image
            alt="Earn Rewards card"
            className="object-contain"
            height={152}
            src={image}
            width={466}
          />
          <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition duration-300" />
        </div>
        <div className="flex items-center justify-center pt-1">
          <PoweredBy />
        </div>
      </div>
      <CloseButton onClick={onClose} />
    </div>
  )
}
