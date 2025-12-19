import { Cobridge } from 'components/customTunnelsThroughPartners/cobridge'
import { FireFly } from 'components/customTunnelsThroughPartners/firefly'
import { FreeTech } from 'components/customTunnelsThroughPartners/freetech'
import { Interport } from 'components/customTunnelsThroughPartners/interport'
import { Memebridge } from 'components/customTunnelsThroughPartners/memebridge'
import { Meson } from 'components/customTunnelsThroughPartners/meson'
import { OwIto } from 'components/customTunnelsThroughPartners/owito'
import { Relay } from 'components/customTunnelsThroughPartners/relay'
import { Stargate } from 'components/customTunnelsThroughPartners/stargate'
import { WarningIcon } from 'components/icons/warningIcon'
import { Tab, Tabs } from 'components/tabs'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { Chain } from 'viem'

import { useTunnelState } from '../_hooks/useTunnelState'

type Props = Pick<
  ReturnType<typeof useTunnelState>,
  'fromNetworkId' | 'toNetworkId' | 'providerType' | 'toggleTunnelProviderType'
>

type ThirdPartyOptionsProps = {
  fromChainId: Chain['id']
  toChainId: Chain['id']
}

function ThirdPartyOptions({ fromChainId, toChainId }: ThirdPartyOptionsProps) {
  const fromNativeToken = getNativeToken(fromChainId)
  const toNativeToken = getNativeToken(toChainId)

  return (
    <div className="max-h-72 items-center justify-center space-y-3 overflow-y-auto rounded-lg bg-neutral-50 p-4">
      <Stargate
        fromToken={fromNativeToken}
        label="Stargate"
        toToken={toNativeToken}
      />
      <FreeTech label="Free Tech" />
      <Interport fromChainId={fromChainId} toChainId={toChainId} />
      <Meson label="Meson" />
      <Cobridge fromChainId={fromChainId} toChainId={toChainId} />
      <OwIto />
      <Memebridge />
      <Relay />
      <FireFly />
    </div>
  )
}

export const TunnelProviderToggle = function ({
  fromNetworkId,
  providerType,
  toggleTunnelProviderType,
  toNetworkId,
}: Props) {
  const t = useTranslations('tunnel-page')
  const { track } = useUmami()

  const toggleNativeProvider = function () {
    toggleTunnelProviderType('native')
    track?.('toggle to hemi tunnel')
  }

  const toggleThirdPartyProvider = function () {
    toggleTunnelProviderType('thirdParty')
    track?.('toggle to 3rd party bridge')
  }

  return (
    <>
      <div className="mt-3 md:bg-transparent [&>ul>li]:py-0 [&>ul]:gap-x-3 [&_li]:flex-1 [&_li]:md:flex-1">
        <Tabs>
          <Tab
            onClick={toggleNativeProvider}
            selected={providerType === 'native'}
            size="small"
          >
            {t('form.hemi-tunnel')}
          </Tab>
          <Tab
            onClick={toggleThirdPartyProvider}
            selected={providerType === 'thirdParty'}
            size="small"
          >
            {t('form.third-party-bridge')}
          </Tab>
        </Tabs>
      </div>
      {providerType === 'thirdParty' && (
        <>
          {/* As this is used by Evm networks only, we can cast these safely */}
          <ThirdPartyOptions
            fromChainId={fromNetworkId as number}
            toChainId={toNetworkId as number}
          />
          <div className="mt-3 flex items-center justify-center gap-x-1 text-neutral-900">
            <WarningIcon />
            <p className="text-center font-normal">
              {t('tunnel-partners.use-at-your-own-risk')}
            </p>
          </div>
        </>
      )}
    </>
  )
}
