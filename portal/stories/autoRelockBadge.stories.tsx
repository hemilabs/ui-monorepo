import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutoRelockBadge } from 'app/[locale]/hemi-stake/_components/stakeTable/autoRelockBadge'
import { type Locale, locales } from 'i18n/routing'
import en from 'messages/en.json'
import es from 'messages/es.json'
import pt from 'messages/pt.json'
import { IntlProvider, type Messages } from 'use-intl'

const messagesByLocale: Record<Locale, Messages> = { en, es, pt }

// the auto-relock column would sit between rewards (95px) and action
const columnWidth = 'w-28'

const meta = {
  args: { enabled: true },
  component: AutoRelockBadge,
  decorators: [
    Story => (
      <IntlProvider locale="en" messages={en}>
        <Story />
      </IntlProvider>
    ),
  ],
  parameters: { layout: 'centered' },
  title: 'Components/Auto-relock Badge',
} satisfies Meta<typeof AutoRelockBadge>

export default meta

type Story = StoryObj<typeof AutoRelockBadge>

export const On: Story = {
  args: { enabled: true },
}

export const Off: Story = {
  args: { enabled: false },
}

export const AllLocales: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-y-3">
      {locales.map(locale => (
        <IntlProvider
          key={locale}
          locale={locale}
          messages={messagesByLocale[locale]}
        >
          <div className="flex items-center gap-x-3">
            <span className="w-6 text-xs font-medium uppercase text-neutral-500">
              {locale}
            </span>
            <div
              className={`flex ${columnWidth} items-center border border-dashed border-neutral-300`}
            >
              <AutoRelockBadge enabled />
            </div>
            <div
              className={`flex ${columnWidth} items-center border border-dashed border-neutral-300`}
            >
              <AutoRelockBadge enabled={false} />
            </div>
          </div>
        </IntlProvider>
      ))}
    </div>
  ),
}
