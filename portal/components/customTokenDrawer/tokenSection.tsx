'use client'

import { DrawerParagraph } from 'components/drawer'
import { SearchInput } from 'components/inputText'
import { ShortVerticalLine } from 'components/verticalLines'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Token } from 'types/token'
import { Chain } from 'viem'

import { AddressValidity } from './addressValidity'
import { PositionStatus } from './positionStatus'
import { SeeOnExplorer } from './seeOnExplorer'
import { TokenPreview } from './tokenPreview'

type Props = {
  addressDisabled: boolean
  addressValidity: AddressValidity | undefined
  chainId: Chain['id']
  isLoading: boolean
  token: Token
} & (
  | { layer: 1 }
  | {
      layer: 2
      tunneledCustomTokenAddress?: string
      onTunneledCustomTokenAddressChange?: (str: string) => void
    }
)

export const TokenSection = function ({
  addressDisabled,
  addressValidity,
  chainId,
  isLoading,
  layer,
  token,
  ...props
}: Props) {
  const chain = useChain(chainId)
  const [hasFocused, setHasFocused] = useState(false)
  const t = useTranslations('token-custom-drawer')

  const isCustomAddress = 'tunneledCustomTokenAddress' in props

  const addressValue = isCustomAddress
    ? props.tunneledCustomTokenAddress
    : token?.address ?? ''

  return (
    <>
      <div className="px-4 md:px-6">
        <div className="py-3">
          <DrawerParagraph>
            {t('layer-token-address', { layer })}
          </DrawerParagraph>
        </div>
        <div className="left-2.25 relative top-0.5">
          <ShortVerticalLine stroke="stroke-neutral-300/55" />
        </div>
        <div className="mt-1 flex gap-x-3">
          <PositionStatus position={layer} />
          <div className="flex w-full flex-col gap-y-2">
            <p className="text-sm font-medium text-neutral-950">
              {t('add-token-on-chain', { network: chain.name })}
            </p>
            <SearchInput
              disabled={addressDisabled}
              onBlur={() => setHasFocused(true)}
              onChange={
                isCustomAddress
                  ? e =>
                      props.onTunneledCustomTokenAddressChange(e.target.value)
                  : undefined
              }
              onClear={
                isCustomAddress && !addressDisabled
                  ? () => props.onTunneledCustomTokenAddressChange('')
                  : undefined
              }
              showMagnifyingGlass={false}
              value={addressValue}
            />
            <div className="flex items-center justify-between">
              {!isLoading && (addressValue.length > 0 || hasFocused) ? (
                <>
                  <AddressValidity validity={addressValidity} />
                  {!!token && (
                    <SeeOnExplorer address={token.address} chainId={chainId} />
                  )}
                </>
              ) : (
                <div className="h-5 w-full" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <TokenPreview isLoading={isLoading} token={token} />
      </div>
    </>
  )
}
