'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Button } from 'components/button'
import { Drawer } from 'components/drawer'
import { useChain } from 'hooks/useChain'
import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useL2Token } from 'hooks/useL2Token'
import { getUseTokenQueryKey, useToken } from 'hooks/useToken'
import { useUserTokenList } from 'hooks/useUserTokenList'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { getRemoteTokens } from 'tokenList'
import { EvmToken, L2Token, Token } from 'types/token'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { isL2Network } from 'utils/chain'
import { type Chain, checksumAddress, isAddress, isAddressEqual } from 'viem'

import { Acknowledge } from './acknowledge'
import { AddPairToHemi } from './addPairToHemi'
import { TokenSection } from './tokenSection'

type Props = {
  fromNetworkId: Chain['id']
  l1ChainId: Chain['id']
  l2ChainId: Chain['id']
  onSelectToken(fromToken: Token, toToken: Token)
}

const canSubmit = ({
  acknowledged,
  l1CustomToken,
  l2customToken,
}: {
  acknowledged: boolean
  l1CustomToken: Token | undefined
  l2customToken: L2Token | undefined
}) =>
  acknowledged &&
  !!l1CustomToken &&
  !!l2customToken &&
  isAddress(l1CustomToken.address) &&
  isAddressEqual(l2customToken.l1Token, l1CustomToken.address)

export const CustomTokenDrawer = function ({
  fromNetworkId,
  l1ChainId,
  l2ChainId,
  onSelectToken,
}: Props) {
  // as fromNetworkId, it will never be a BtcChain
  const fromChain = useChain(fromNetworkId) as Chain
  const isL2 = isL2Network(fromChain)

  const [customTokenAddress, setCustomTokenAddress] = useCustomTokenAddress()
  const queryClient = useQueryClient()
  const { addToken } = useUserTokenList()
  const [tunneledCustomTokenAddress, setTunneledCustomTokenAddress] =
    useState('')

  const { data: l2customToken, isLoading: isLoadingL2Token } = useL2Token({
    address: isL2 ? customTokenAddress : tunneledCustomTokenAddress,
    chainId: l2ChainId,
    options: {
      enabled: isL2 || !!tunneledCustomTokenAddress,
      // we may have an incomplete view in the cache of this, useful when
      // reading the L2 token
      placeholderData: queryClient.getQueryData<L2Token>(
        getUseTokenQueryKey(
          isL2 ? customTokenAddress : tunneledCustomTokenAddress,
          l2ChainId,
        ),
      ),
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

  const submitEnabled = canSubmit({
    acknowledged,
    l1CustomToken,
    l2customToken,
  })

  const closeDrawer = () => setCustomTokenAddress(null)
  const onTunneledCustomTokenAddressChange = (str: string) =>
    setTunneledCustomTokenAddress(str)

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    // although they are not direct children in the DOM, in React this component
    // is used inside deposit/withdrawal/etc which contain a form.
    // so submitting will trigger the submit. So we need to stop the propagation!
    e.stopPropagation()
    if (!submitEnabled) {
      return
    }

    const { l1Token, ...tokenData } = l2customToken
    // the token list is saved with chainId from Hemi, and then the opposite is generated
    // from the tunnel info. See https://github.com/hemilabs/token-list/blob/master/src/hemi.tokenlist.json
    // for examples
    const l2TokenAdded = {
      ...tokenData,
      extensions: {
        bridgeInfo: {
          [l1ChainId]: {
            tokenAddress: checksumAddress(l1Token, l1ChainId),
          },
        },
      },
    } satisfies EvmToken

    addToken(l2TokenAdded)

    const l1TokenAdded = getRemoteTokens(l2TokenAdded).find(
      token => token.chainId === l1ChainId,
    )
    // however, as we close the drawer and auto-select this token to tunnel
    // chances are that the state from local storage is not synced
    // so for this particular scenario we will use the token from memory
    onSelectToken(
      isL2 ? l2TokenAdded : l1TokenAdded,
      isL2 ? l1TokenAdded : l2TokenAdded,
    )

    closeDrawer()
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
          <Acknowledge acknowledged={acknowledged} onChange={setAcknowledged} />
          <div className="flex [&>*]:basis-full">
            <Button disabled={!submitEnabled} type="submit" variant="primary">
              {t('add-token')}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
