import { FreeTech } from 'components/customTunnelsThroughPartners/freetech'
import { Interport } from 'components/customTunnelsThroughPartners/interport'
import { Meson } from 'components/customTunnelsThroughPartners/meson'
import { Stargate } from 'components/customTunnelsThroughPartners/stargate'
import { WarningIcon } from 'components/icons/warningIcon'
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
    <div className="flex-col items-center justify-center space-y-3 rounded-lg bg-neutral-50 p-4">
      <Stargate
        fromToken={fromNativeToken}
        label="Stargate"
        toToken={toNativeToken}
      />
      <FreeTech />
      <Interport fromChainId={fromChainId} toChainId={toChainId} />
      <Meson label="Meson" />
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
      <div className="flex w-full items-center justify-center rounded-lg bg-neutral-100 p-1">
        <button
          className={`flex-1 rounded-md p-1 text-sm font-medium transition ${
            providerType === 'native'
              ? 'border-neutral-300/56 border bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
          onClick={toggleNativeProvider}
          type="button"
        >
          {t('form.hemi-tunnel')}
        </button>
        <button
          className={`flex-1 rounded-md p-1 text-sm font-medium transition ${
            providerType === 'thirdParty'
              ? 'border-neutral-300/56 border bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
          onClick={toggleThirdPartyProvider}
          type="button"
        >
          {t('form.third-party-bridge')}
        </button>
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
            <p className="text-center text-sm font-normal">
              {t('tunnel-partners.use-at-your-own-risk')}
            </p>
          </div>
        </>
      )}
    </>
  )
}
