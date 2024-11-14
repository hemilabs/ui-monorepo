'use client'

import { Button } from 'components/button'
import { Drawer } from 'components/drawer'
import { useChain } from 'hooks/useChain'
import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useL2Token } from 'hooks/useL2Token'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { isL2Network } from 'utils/chain'
import { type Chain } from 'viem'

import { AddPairToHemi } from './addPairToHemi'
import { TokenSection } from './tokenSection'

type Props = {
  fromNetworkId: Chain['id']
  l1ChainId: Chain['id']
  l2ChainId: Chain['id']
}

export const CustomTokenDrawer = function ({
  fromNetworkId,
  l1ChainId,
  l2ChainId,
}: Props) {
  // as fromNetworkId, it will never be a BtcChain
  const fromChain = useChain(fromNetworkId) as Chain
  const isL2 = isL2Network(fromChain)

  const [customTokenAddress, setCustomTokenAddress] = useCustomTokenAddress()
  const [tunneledCustomTokenAddress, setTunneledCustomTokenAddress] =
    useState('')

  const { data: l2customToken, isLoading: isLoadingL2Token } = useL2Token({
    address: isL2 ? customTokenAddress : tunneledCustomTokenAddress,
    chainId: l2ChainId,
    options: {
      enabled: isL2 || !!tunneledCustomTokenAddress,
      retry: 1,
    },
  })

  const { data: l1CustomToken, isLoading: isLoadingL1Token } = useToken({
    address: isL2 ? l2customToken?.l1Token : customTokenAddress,
    chainId: l1ChainId,
    options: {
      enabled: !isL2 || !!l2customToken?.l1Token,
      retry: 1,
    },
  })

  const [acknowledged, setAcknowledged] = useState(false)
  const t = useTranslations('token-custom-drawer')

  const canSubmit = acknowledged && !!l1CustomToken && !!l2customToken

  const closeDrawer = () => setCustomTokenAddress(null)
  const onTunneledCustomTokenAddressChange = (str: string) =>
    setTunneledCustomTokenAddress(str)

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      return
    }
  }

  return (
    <Drawer onClose={closeDrawer}>
      <form
        className="flex h-[80dvh] w-full flex-col gap-y-3 overflow-y-auto bg-white px-4 py-6 md:h-full md:w-[450px] md:max-w-md md:px-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-neutral-950">
            {t('heading')}
          </h2>
          <button
            className="cursor-pointer"
            onClick={closeDrawer}
            type="button"
          >
            <CloseIcon className="[&>path]:hover:stroke-black" />
          </button>
        </div>
        <p className="text-sm font-medium text-neutral-500">
          {t('subheading')}
        </p>
        <TokenSection
          addressDisabled
          chainId={l1ChainId}
          isLoading={isLoadingL1Token}
          layer={1}
          token={l1CustomToken}
        />
        <TokenSection
          addressDisabled={isL2}
          chainId={l2ChainId}
          isLoading={isLoadingL2Token}
          layer={2}
          token={l2customToken}
          // the address field of this section is only editable
          // if the user originally entered an address for an L1
          {...(isL2
            ? {}
            : {
                onTunneledCustomTokenAddressChange,
                tunneledCustomTokenAddress,
              })}
        />
        <AddPairToHemi />
        <div className="mt-auto flex flex-col gap-y-3">
          <label
            className="relative flex cursor-pointer items-center gap-x-2"
            htmlFor="custom-token-acknowledged"
          >
            <input
              checked={acknowledged}
              className="shadow-soft checkbox h-4 w-4 cursor-pointer appearance-none rounded border border-solid border-neutral-300/55 bg-white
              transition-all checked:border-0 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500"
              id="custom-token-acknowledged"
              onChange={e => setAcknowledged(e.target.checked)}
              type="checkbox"
            />
            {acknowledged && (
              <div className="pointer-events-none absolute left-0.5 top-1">
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M2 6.5l2.5 2.5L10 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <span className="text-sm font-medium text-neutral-500">
              {t('i-am-sure-to-tunnel')}
            </span>
          </label>
          <div className="flex [&>*]:basis-full">
            <Button disabled={!canSubmit} type="submit" variant="primary">
              {t('add-token')}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
