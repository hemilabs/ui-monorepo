'use client'

import { Card } from 'components/card'
import { Tab, Tabs } from 'components/tabs'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { sepolia } from 'networks/sepolia'
import { useTranslations } from 'next-intl'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
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
    <Section card={false} step={{ position: 1 }}>
      <Card>
        <div className="grid w-full grid-cols-1 font-medium lg:grid-cols-[396px_1fr] lg:items-start">
          <div className="p-6">
            <div className="max-w-[332px]">
              <h3 className="text-mid-md font-semibold text-neutral-950">
                {t('add-hemi-network-to-your-wallet')}
              </h3>
              <p className="mt-1 font-normal text-neutral-500">
                {t('add-hemi-network-description')}
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="w-full lg:ml-auto lg:max-w-[500px]">
              <div className="mb-4 flex md:justify-end md:[&_ul]:w-auto">
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
              <div className="animate-fade-in" key={networkConfiguration}>
                <AddSection networkConfiguration={networkConfiguration} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Section>
  )
}
