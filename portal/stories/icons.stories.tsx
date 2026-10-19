import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentType, ReactNode } from 'react'

type Icon = {
  element: ReactNode
  name: string
  path: string
}

type IconModule = Record<string, ComponentType | Record<string, ComponentType>>

const iconComponents = import.meta.glob<IconModule>(
  '../{app,components}/**/{icons,_icons}/*.tsx',
  { eager: true },
)

const iconFiles = import.meta.glob<string>(
  '../{app,components}/**/{icons,_icons}/*.{png,svg}',
  { eager: true, import: 'default' },
)

const toPath = (globKey: string) => globKey.replace('../', '')

const toFileName = (globKey: string) => globKey.split('/').pop()!

const toComponents = ([exportName, value]: [string, IconModule[string]]) =>
  typeof value === 'function'
    ? [{ IconComponent: value, name: exportName }]
    : Object.entries(value).map(([key, IconComponent]) => ({
        IconComponent,
        name: `${exportName}.${key}`,
      }))

const icons: Icon[] = Object.entries(iconComponents)
  .flatMap(([globKey, module]) =>
    Object.entries(module)
      .flatMap(toComponents)
      .map(({ IconComponent, name }) => ({
        element: <IconComponent />,
        name,
        path: toPath(globKey),
      })),
  )
  .concat(
    Object.entries(iconFiles).map(([globKey, url]) => ({
      element: <img alt="" className="size-8 object-contain" src={url} />,
      name: toFileName(globKey),
      path: toPath(globKey),
    })),
  )
  .sort((a, b) => a.name.localeCompare(b.name))

const IconGrid = () => (
  <div className="grid h-dvh grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] content-start gap-2 overflow-y-auto p-4">
    {icons.map(icon => (
      <div
        className="flex flex-col items-center gap-y-2 rounded-lg border border-neutral-500/25 p-3"
        key={icon.path + icon.name}
        title={icon.path}
      >
        <div className="flex min-h-8 max-w-full items-center justify-center overflow-hidden [&>svg:not([width])]:size-8">
          {icon.element}
        </div>
        <span className="break-all text-center text-xs">{icon.name}</span>
      </div>
    ))}
  </div>
)

const meta = {
  component: IconGrid,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Icons',
} satisfies Meta<typeof IconGrid>

export default meta

type Story = StoryObj<typeof IconGrid>

export const AllIcons: Story = {}

export const AllIconsOnDarkSurface: Story = {
  render: () => (
    <div className="min-h-dvh bg-neutral-900 text-white">
      <IconGrid />
    </div>
  ),
}
