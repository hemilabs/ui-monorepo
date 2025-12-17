import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'

import { BitcoinKitLink } from './_components/bitcoinKitLink'
import { BitcoinYield } from './_components/bitcoinYield'
import { Dex } from './_components/dex'
import { DocsLink } from './_components/docsLink'
import { EcosystemLink } from './_components/ecosystemLink'
import { GenesisDrop } from './_components/genesisDrop'
import { GetStarted } from './_components/getStarted'
import { HelpButton } from './_components/help/helpButton'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { HemiStatusLink } from './_components/hemiStatusLink'
import { IconContainer as BaseIconContainer } from './_components/iconContainer'
import { ItemContainer, ItemText } from './_components/navItem'
import { NetworkSwitch } from './_components/networkSwitch'
import { SocialLinks } from './_components/socialLinks'
import { StakeMobile } from './_components/stake'
import { TunnelLink } from './_components/tunnelLink'
import { Tvl } from './_components/tvl'

const Help = dynamic(() => import('./_components/help').then(mod => mod.Help), {
  // Render the closed version of the help button
  loading: () => <HelpButton isOpen={false} />,
  ssr: false,
})

const FullItem = (props: ComponentProps<'li'>) => (
  <li className="w-full" {...props} />
)

const IconContainer = (props: ComponentProps<typeof BaseIconContainer>) => (
  <BaseIconContainer size="size-6 md:size-5" {...props} />
)

const RowContainer = (props: ComponentProps<'div'>) => (
  <div
    className="flex w-full flex-row items-center gap-2 max-md:justify-start"
    {...props}
  />
)

const SmallBox = (props: ComponentProps<'li'>) => (
  <li className="h-24.5 shrink grow basis-1/3" {...props} />
)

const CustomContainer = (props: ComponentProps<typeof ItemContainer>) => (
  <ItemContainer
    justifyItems="justify-start md:justify-center"
    padding="p-3"
    {...props}
  />
)

export const NavbarMobile = function () {
  const t = useTranslations('navbar')
  return (
    <div className="h-90dvh overflow-y-auto bg-white px-5 py-6">
      <ul className="flex h-fit flex-wrap justify-start gap-2">
        <SmallBox>
          <BitcoinYield />
        </SmallBox>
        <SmallBox>
          <TunnelLink />
        </SmallBox>
        <SmallBox>
          <Dex />
        </SmallBox>
        <SmallBox>
          <GenesisDrop />
        </SmallBox>
        <SmallBox>
          <StakeMobile />
        </SmallBox>
        <SmallBox>
          <EcosystemLink />
        </SmallBox>
        <FullItem>
          <BitcoinKitLink
            iconContainer={IconContainer}
            itemContainer={CustomContainer}
            row={RowContainer}
          />
        </FullItem>
        <FullItem>
          <DocsLink
            iconContainer={IconContainer}
            itemContainer={CustomContainer}
            row={RowContainer}
          />
        </FullItem>
        <FullItem>
          <HemiExplorerLink
            iconContainer={IconContainer}
            itemContainer={CustomContainer}
            row={RowContainer}
          />
        </FullItem>
        <FullItem>
          <HemiStatusLink
            iconContainer={IconContainer}
            itemContainer={CustomContainer}
            row={RowContainer}
          />
        </FullItem>
        <FullItem>
          <NetworkSwitch
            iconContainer={IconContainer}
            itemContainer={CustomContainer}
            row={RowContainer}
          />
        </FullItem>
        <FullItem>
          <CustomContainer>
            <RowContainer>
              <IconContainer>
                <div className="size-4">
                  <svg
                    fill="none"
                    viewBox="0 0 15 15"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.625 1.125C8.625 0.826631 8.50647 0.540483 8.29549 0.329505C8.08452 0.118526 7.79837 0 7.5 0C7.20163 0 6.91548 0.118526 6.7045 0.329505C6.49353 0.540483 6.375 0.826631 6.375 1.125V6.375H1.125C0.826631 6.375 0.540483 6.49353 0.329505 6.7045C0.118526 6.91548 0 7.20163 0 7.5C0 7.79837 0.118526 8.08452 0.329505 8.29549C0.540483 8.50647 0.826631 8.625 1.125 8.625H6.375V13.875C6.375 14.1734 6.49353 14.4595 6.7045 14.6705C6.91548 14.8815 7.20163 15 7.5 15C7.79837 15 8.08452 14.8815 8.29549 14.6705C8.50647 14.4595 8.625 14.1734 8.625 13.875V8.625H13.875C14.1734 8.625 14.4595 8.50647 14.6705 8.29549C14.8815 8.08452 15 7.79837 15 7.5C15 7.20163 14.8815 6.91548 14.6705 6.7045C14.4595 6.49353 14.1734 6.375 13.875 6.375H8.625V1.125Z"
                      fill="#A3A3A3"
                    />
                  </svg>
                </div>
              </IconContainer>
              <ItemText text={t('follow-us')} />
              <div className="ml-auto flex gap-x-3">
                <SocialLinks />
              </div>
            </RowContainer>
          </CustomContainer>
        </FullItem>
        <FullItem>
          <div className="mt-5">
            <Tvl />
          </div>
        </FullItem>
        <li className="flex h-11 w-full items-center gap-x-3 [&_a]:size-full [&_button]:size-11">
          <Help />
          <GetStarted />
        </li>
      </ul>
    </div>
  )
}
