import { ChainLogo } from 'components/chainLogo'
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

const ChainRow = function ({ chain, layer, networkConfiguration }: ChainProps) {
  const t = useTranslations('get-started')

  return (
    <div className="border-neutral/55 text-ms flex flex-col rounded-xl border border-solid p-4 font-medium leading-5">
      <div className="flex flex-row gap-x-1">
        <ChainLogo chainId={chain.id} />
        <span className="ml-1 text-neutral-950">{chain.name}</span>
        <span className="text-neutral-500">{t('layer', { layer })}</span>
        {networkConfiguration === 'automatic' && (
          <div className="ml-auto">
            <AddChainAutomatically chain={chain} />
          </div>
        )}
      </div>
      {networkConfiguration === 'manual' && (
        <div className="mt-6 md:mt-4">
          <AddChainManually chain={chain} />
        </div>
      )}
    </div>
  )
}

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

  const [networkConfiguration, setNetworkConfiguration] = useQueryState(
    'networkConfiguration',
    parseAsStringLiteral(AddWalletConfigurations).withDefault(
      AddWalletConfigurations[0],
    ),
  )

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
              onClick={() => setNetworkConfiguration('automatic')}
              selected={networkConfiguration === 'automatic'}
            >
              {t('add-networks.automatic')}
            </Tab>
            <Tab
              onClick={() => setNetworkConfiguration('manual')}
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
