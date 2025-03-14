'use client'

import { Button, ButtonLink } from 'components/button'
import { Card } from 'components/card'
import { Drawer } from 'components/drawer'
import { Modal } from 'components/modal'
import { useNetworkType } from 'hooks/useNetworkType'
import { useLocale, useTranslations } from 'next-intl'
import { ComponentType } from 'react'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'
import useLocalStorageState from 'use-local-storage-state'

import { EnabledEn } from './enabledEn'
import { EnabledEs } from './enabledEs'
import { EnabledMobileEn } from './enabledMobileEn'
import { EnabledMobileEs } from './enabledMobileEs'

const useHideMainnetLiveModal = () =>
  useLocalStorageState('portal.hide-mainnet-live-modal', {
    defaultValue: false,
  })

const ModalOverlay = () => (
  <div className="fixed bottom-0 left-0 right-0 top-0 z-20 bg-neutral-950/15 " />
)

const DrawerOverlay = () => (
  <div
    className="fixed bottom-0 left-0 right-0 top-0 z-20"
    style={{
      background:
        'linear-gradient(0deg, rgba(10, 10, 10, 0.40) 65.63%, rgba(10, 10, 10, 0.00) 100%)',
    }}
  />
)

const Content = function ({ img: Img }: { img: ComponentType }) {
  const t = useTranslations('common')
  const [, setHideMainnetLiveModal] = useHideMainnetLiveModal()
  const [, setNetworkType] = useNetworkType()

  return (
    <div className="flex h-[70dvh] flex-col items-center gap-y-6 overflow-x-hidden bg-white px-4 md:h-[470px] md:w-[530px]">
      <Img />
      <div className="mt-4 flex flex-col gap-y-3">
        <h2 className="md:text-3.25xl text-center text-2xl font-semibold text-neutral-950">
          {t('mainnet-is-now-live')}
        </h2>
        <p className="max-w-96 text-center text-base font-normal text-neutral-500">
          {t('mainnet-is-now-live-description')}
        </p>
      </div>
      <div className="flex items-center justify-center gap-x-3 [&>*]:w-36">
        <ButtonLink
          href="/get-started"
          onClick={() => setHideMainnetLiveModal(true)}
          variant="secondary"
        >
          {t('learn-more')}
        </ButtonLink>
        <Button
          height="h-5"
          onClick={function () {
            setHideMainnetLiveModal(true)
            setNetworkType('mainnet')
          }}
          type="button"
        >
          {t('start-using-mainnet')}
        </Button>
      </div>
    </div>
  )
}

export const MainnetLiveModal = function () {
  const locale = useLocale()
  const [hideMainnetLiveModal, setHideMainnetLiveModal] =
    useHideMainnetLiveModal()
  const { width } = useWindowSize()

  if (hideMainnetLiveModal) {
    return null
  }

  const onClose = () => setHideMainnetLiveModal(true)

  return width >= 768 ? (
    <Modal container={document.body} onClose={onClose} overlay={ModalOverlay}>
      <Card>
        <Content img={locale === 'en' ? EnabledEn : EnabledEs} />
      </Card>
    </Modal>
  ) : (
    <Drawer container={document.body} onClose={onClose} overlay={DrawerOverlay}>
      <Content img={locale === 'en' ? EnabledMobileEn : EnabledMobileEs} />
    </Drawer>
  )
}
