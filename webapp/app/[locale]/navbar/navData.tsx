import { hemi } from 'app/networks'
import { ChecklistIcon } from 'components/icons/checklistIcon'
// import { CodeInsertIcon } from 'components/icons/codeInsertIcon'
import { DexIcon } from 'components/icons/dexIcon'
import { ElectroCardiogramIcon } from 'components/icons/electroCardiogramIcon'
import { ExplorerIcon } from 'components/icons/explorerIcon'
import { FiletextIcon } from 'components/icons/filetextIcon'
import { GraduateCapIcon } from 'components/icons/graduateCapIcon'
import { TunnelIcon } from 'components/icons/tunnelIcon'

import { NavItemData } from './_components/navItems'

export const navItems: NavItemData[] = [
  {
    href: '/tunnel',
    icon: TunnelIcon,
    id: 'tunnel',
  },
  {
    href: 'https://hemi.xyz/swap',
    icon: DexIcon,
    id: 'dex',
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
        href: 'https://hemi.xyz/pure.finance',
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
  // {
  //   href: '',
  //   icon: CodeInsertIcon,
  //   id: 'bitcoinhkit',
  // },
]

export const navItemsBottom: NavItemData[] = [
  {
    href: '',
    icon: ElectroCardiogramIcon,
    id: 'networkstatus',
  },
  {
    href: 'https://docs.hemi.xyz',
    icon: FiletextIcon,
    id: 'hemidocs',
  },
]
