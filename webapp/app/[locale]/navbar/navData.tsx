import { ChecklistIcon } from 'components/icons/checklistIcon'
import { CodeInsertIcon } from 'components/icons/codeInsertIcon'
import { DexIcon } from 'components/icons/dexIcon'
// import { ElectroCardiogramIcon } from 'components/icons/electroCardiogramIcon'
import { ExplorerIcon } from 'components/icons/explorerIcon'
import { FiletextIcon } from 'components/icons/filetextIcon'
import { GraduateCapIcon } from 'components/icons/graduateCapIcon'
import { PoPMinerIcon } from 'components/icons/popMinerIcon'
import { TunnelIcon } from 'components/icons/tunnelIcon'
import dynamic from 'next/dynamic'
import { type Chain } from 'viem'

import { NavItemData } from './_components/navItems'

const ActionableOperations = dynamic(
  () =>
    import('../tunnel/_components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

export const getNavItems = (hemi: Chain): NavItemData[] => [
  {
    alertComponent: () => (
      <div className="-mt-1">
        <ActionableOperations />
      </div>
    ),
    href: '/tunnel',
    icon: TunnelIcon,
    id: 'tunnel',
  },
  {
    href: 'https://swap.hemi.xyz',
    icon: DexIcon,
    id: 'dex',
  },
  {
    href: 'https://docs.hemi.xyz/building-bitcoin-apps/hemi-bitcoin-kit-hbk',
    icon: CodeInsertIcon,
    id: 'bitcoinkit',
  },
  {
    href: 'https://pop-miner.hemi.xyz',
    icon: PoPMinerIcon,
    id: 'web-pop-miner',
  },
  {
    href: hemi.blockExplorers.default.url,
    icon: ExplorerIcon,
    id: 'explorer',
  },
  {
    href: '/demos',
    icon: GraduateCapIcon,
    id: 'demos',
  },
  {
    href: '',
    icon: ChecklistIcon,
    id: 'tools',
    subMenus: [
      {
        href: 'https://purefinance.hemi.xyz',
        id: 'purefinance',
        text: 'Pure Finance',
      },
      {
        href: 'https://discord.com/channels/1202677849887080508/1230886659222929418',
        id: 'faucet',
        text: 'Faucet',
      },
    ],
  },
]

export const navItemsBottom: NavItemData[] = [
  // The "network status" service/page is still not defined. Once it is up and
  // the URL is defined, the following item should be updated and un-commented.
  // {
  //   href: '',
  //   icon: ElectroCardiogramIcon,
  //   id: 'networkstatus',
  // },
  {
    href: 'https://docs.hemi.xyz',
    icon: FiletextIcon,
    id: 'hemidocs',
  },
]
