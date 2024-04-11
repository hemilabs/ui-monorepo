import { hemi } from 'app/networks'
import { ArrowDownLeftIcon } from 'components/icons/ArrowDownLeftIcon'
import { ChecklistIcon } from 'components/icons/ChecklistIcon'
import { ChevronBottomIcon } from 'components/icons/ChevronBottomIcon'
import { ChevronUpIcon } from 'components/icons/ChevronUpIcon'
import { CodeInsertIcon } from 'components/icons/CodeInsertIcon'
import { DexIcon } from 'components/icons/DexIcon'
import { ElectroCardiogramIcon } from 'components/icons/ElectroCardiogramIcon'
import { ExplorerIcon } from 'components/icons/ExplorerIcon'
import { FiletextIcon } from 'components/icons/FiletextIcon'
import { GraduateCapIcon } from 'components/icons/GraduateCapIcon'
import { TunnelIcon } from 'components/icons/TunnelIcon'

import { NavItemData } from './_components/NavItems'

export const navItems: NavItemData[] = [
  {
    color: 'gray-3',
    href: '/tunnel',
    icon: TunnelIcon,
    id: 'tunnel',
  },
  {
    color: 'gray-3',
    href: '',
    icon: DexIcon,
    iconRightClosed: ArrowDownLeftIcon,
    id: 'dex',
  },
  {
    color: 'gray-3',
    href: `${hemi.blockExplorers.default.url}`,
    icon: ExplorerIcon,
    iconRightClosed: ArrowDownLeftIcon,
    id: 'explorer',
    isExternal: true,
  },
  {
    color: 'gray-3',
    href: '/tutorials',
    icon: GraduateCapIcon,
    id: 'tutorials',
  },
  {
    color: 'gray-3',
    href: '',
    icon: ChecklistIcon,
    iconRightClosed: ChevronBottomIcon,
    iconRightOpened: ChevronUpIcon,
    id: 'tools',
    subMenus: [
      { id: 'purefinance', text: 'Pure Finance' },
      { id: 'faucet', text: 'Faucet' },
    ],
  },
  {
    color: 'gray-3',
    href: '',
    icon: CodeInsertIcon,
    iconRightClosed: ArrowDownLeftIcon,
    id: 'bitcoinhkit',
  },
]

export const navItemsBottom: NavItemData[] = [
  {
    color: 'gray-9',
    href: '',
    icon: ElectroCardiogramIcon,
    iconRightClosed: ArrowDownLeftIcon,
    id: 'networkstatus',
  },
  {
    color: 'gray-9',
    href: 'https://docs.hemi.xyz',
    icon: FiletextIcon,
    iconRightClosed: ArrowDownLeftIcon,
    id: 'hemidocs',
    isExternal: true,
  },
]
