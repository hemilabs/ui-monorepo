import { useUmami } from 'app/analyticsEvents'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { useNetworkType } from 'hooks/useNetworkType'
import { sepolia } from 'networks/sepolia'
import { useTranslations } from 'next-intl'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Tab, Tabs } from 'ui-common/components/tabs'
import { type Chain } from 'viem'

import { AddChainAutomatically } from './addChainAutomatically'
import { AddChainManually } from './addChainManually'
import { Section } from './section'

const AddWalletConfigurations = ['automatic', 'manual'] as const

type ChainProps = {
  chain: Chain
  layer: number
  networkConfiguration: (typeof AddWalletConfigurations)[number]
}

const ChainRow = ({ chain, layer, networkConfiguration }: ChainProps) =>
  networkConfiguration === 'automatic' ? (
    <AddChainAutomatically chain={chain} layer={layer} />
  ) : (
    <AddChainManually chain={chain} layer={layer} />
  )

const AddSection = function ({
  networkConfiguration,
}: Pick<ChainProps, 'networkConfiguration'>) {
  const [networkType] = useNetworkType()
  const hemi = useHemi()

  // as the tunnel may be using a custom RPC, we want users to add the public original one.
  // For that, use the original hemi definition from hemi-viem
  const hemiToAdd = hemi.id === hemiTestnet.id ? hemiTestnet : hemiMainnet
  return (
    <div className="flex flex-col gap-y-3">
      <ChainRow
        chain={hemiToAdd}
        layer={2}
        networkConfiguration={networkConfiguration}
      />
      {networkType === 'testnet' && (
        // All users will already have Ethereum mainnet enabled in their wallets
        <ChainRow
          chain={sepolia}
          layer={1}
          networkConfiguration={networkConfiguration}
        />
      )}
    </div>
  )
}

export const AddHemiWallet = function () {
  const [networkType] = useNetworkType()
  const t = useTranslations('get-started')
  const { track } = useUmami()

  const [networkConfiguration, setNetworkConfiguration] = useQueryState(
    'networkConfiguration',
    parseAsStringLiteral(AddWalletConfigurations).withDefault(
      AddWalletConfigurations[0],
    ),
  )

  const onSelectAutomatic = function () {
    setNetworkConfiguration('automatic')
    track?.('network - automatic')
  }

  const onSelectManual = function () {
    setNetworkConfiguration('manual')
    track?.('network - manual')
  }

  return (
    <Section
      heading={t('add-hemi-to-your-wallet')}
      step={{
        description: t('add-networks-to-wallet'),
        position: 1,
      }}
      subheading={t(`add-networks-${networkType}`)}
    >
      <div className="flex flex-col gap-y-4 md:basis-1/2">
        <div className="md:self-end">
          <Tabs>
            <Tab
              onClick={onSelectAutomatic}
              selected={networkConfiguration === 'automatic'}
            >
              {t('add-networks.automatic')}
            </Tab>
            <Tab
              onClick={onSelectManual}
              selected={networkConfiguration === 'manual'}
            >
              {t('add-networks.manual')}
            </Tab>
          </Tabs>
        </div>
        <AddSection networkConfiguration={networkConfiguration} />
      </div>
    </Section>
  )
}
