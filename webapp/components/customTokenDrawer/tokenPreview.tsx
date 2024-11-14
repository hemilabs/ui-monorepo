import { CustomToken } from 'components/tokenSelector/token'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'

import background from './previewBackground.svg'

type Props = { isLoading: boolean; token: Token }

export const TokenPreview = function ({ isLoading, token }: Props) {
  const t = useTranslations('token-custom-drawer')
  return (
    <div className="relative -mx-4 my-1 border-b border-t border-dashed border-neutral-300/55 bg-neutral-50 md:-mx-6">
      <div className="absolute bottom-0 left-0 right-0 top-0">
        <Image alt="Token Preview background" fill src={background} />
      </div>
      <div className="relative z-10 mx-auto w-3/4 py-1.5">
        {token || isLoading ? (
          <CustomToken token={token} />
        ) : (
          <p className="flex h-14 items-center justify-center text-sm font-medium text-neutral-500">
            {t('add-contract-to-preview')}
          </p>
        )}
      </div>
    </div>
  )
}
