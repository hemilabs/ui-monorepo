'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Button } from 'components/button'
import { Drawer, DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { useChain } from 'hooks/useChain'
import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useL2Token } from 'hooks/useL2Token'
import { getUseTokenQueryKey, useToken } from 'hooks/useToken'
import { useUserTokenList } from 'hooks/useUserTokenList'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { getRemoteTokens } from 'tokenList'
import { EvmToken, L2Token, Token } from 'types/token'
import { isL2Network } from 'utils/chain'
import {
  type Address,
  type Chain,
  checksumAddress,
  isAddress,
  isAddressEqual,
} from 'viem'

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

const getL1AddressValidity = (l1CustomToken: Token | undefined) =>
  l1CustomToken ? 'this-address-is-valid' : 'this-address-is-not-valid'

const getL2AddressValidity = function (
  l1CustomToken: Token | undefined,
  l2customToken: L2Token | undefined,
) {
  if (!l2customToken) {
    return 'this-address-is-not-valid'
  }
  if (!l1CustomToken) {
    return undefined
  }
  if (
    !isAddressEqual(l2customToken.l1Token, l1CustomToken.address as Address)
  ) {
    return 'address-does-not-match-l2'
  }
  return 'this-address-is-valid'
}

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
        className="drawer-content h-[80dvh] md:h-full"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-y-3">
          <DrawerTopSection heading={t('heading')} onClose={closeDrawer} />
          <DrawerParagraph>{t('subheading')}</DrawerParagraph>
        </div>
        <div className="skip-parent-padding-x flex flex-1 flex-col overflow-y-auto">
          <TokenSection
            addressDisabled
            addressValidity={getL1AddressValidity(l1CustomToken)}
            chainId={l1ChainId}
            isLoading={isLoadingL1Token}
            layer={1}
            token={l1CustomToken}
          />
          <TokenSection
            addressDisabled={isL2}
            addressValidity={getL2AddressValidity(l1CustomToken, l2customToken)}
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
        </div>
        <CallToActionContainer>
          <div className="flex w-full flex-col gap-y-3">
            <Acknowledge
              acknowledged={acknowledged}
              onChange={setAcknowledged}
            />
            <div className="flex [&>*]:basis-full">
              <Button disabled={!submitEnabled} type="submit" variant="primary">
                {t('add-token')}
              </Button>
            </div>
          </div>
        </CallToActionContainer>
      </form>
    </Drawer>
  )
}
