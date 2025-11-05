import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useToken } from 'hooks/useToken'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { type Address, type Chain, isAddress, getAddress } from 'viem'

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
  const isAddressValid = isAddress(searchText, { strict: false })
  const normalizedSearchAddress = isAddressValid
    ? getAddress(searchText)
    : searchText

  const { data: customToken, status } = useToken({
    address: normalizedSearchAddress,
    chainId,
    options: {
      retry: 1,
    },
  })

  const { track } = useUmami()

  const userTypedAddress = isAddress(searchText, { strict: false })

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
    setCustomTokenAddress(normalizedSearchAddress as Address)
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
