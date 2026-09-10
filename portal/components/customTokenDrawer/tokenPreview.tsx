import { Image } from 'components/image'
import { CustomToken } from 'components/tokenSelector/token'
import { Token } from 'types/token'
import { useTranslations } from 'use-intl'

import background from './previewBackground.svg'

type Props = { isLoading: boolean; token: Token | undefined }

export const TokenPreview = function ({ isLoading, token }: Props) {
  const t = useTranslations('token-custom-drawer')
  return (
    <div className="relative z-0 border-b border-t border-dashed border-neutral-300/55 bg-neutral-50">
      <Image
        alt="Token Preview background"
        className="absolute inset-0 size-full"
        src={background}
      />
      <div className="relative z-10 mx-auto w-3/4 py-1.5">
        {token || isLoading ? (
          <CustomToken token={token} />
        ) : (
          <p className="flex h-14 items-center justify-center font-medium text-neutral-500">
            {t('add-contract-to-preview')}
          </p>
        )}
      </div>
    </div>
  )
}
