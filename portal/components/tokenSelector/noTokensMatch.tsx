import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useToken } from 'hooks/useToken'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { type Chain, isAddress } from 'viem'

import { CustomToken } from './token'

type Props = {
  chainId: Chain['id']
  closeModal: VoidFunction
  searchText: string
}

export const NoTokensMatch = function ({
  chainId,
  closeModal,
  searchText,
}: Props) {
  const [, setCustomTokenAddress] = useCustomTokenAddress()
  const { data: customToken, status } = useToken({
    address: searchText,
    chainId,
    options: {
      retry: 1,
    },
  })
  const { track } = useUmami()

  const userTypedAddress = isAddress(searchText)
  const t = useTranslations('token-selector')

  if (!userTypedAddress || status === 'error') {
    return (
      <span className="text-center text-sm font-medium text-neutral-500">
        {t.rich('no-results-for', {
          search: () => <span className="text-neutral-950">{searchText}</span>,
        })}
      </span>
    )
  }

  const onClick = function () {
    setCustomTokenAddress(searchText)
    closeModal()
    track?.('custom erc20 - open modal', { address: searchText })
  }

  return (
    <div className="flex h-full flex-col items-center justify-between">
      <div
        className={`w-full rounded-lg hover:bg-neutral-100 ${
          customToken ? 'cursor-pointer' : ''
        }`}
        onClick={customToken ? onClick : undefined}
      >
        <CustomToken token={customToken} />
      </div>
      {status === 'pending' && (
        <span className="text-sm text-neutral-500">
          {t('validating-token-address')}
        </span>
      )}
    </div>
  )
}
