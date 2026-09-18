import { ErrorBoundary } from 'components/errorBoundary'
import { CloseIcon } from 'components/icons/closeIcon'
import { Link } from 'components/link'
import { PixelPool } from 'components/pixelPool'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { type MouseEvent } from 'react'
import { useTranslations } from 'use-intl'
import useLocalStorageState from 'use-local-storage-state'
import { isSamePathOrUnder } from 'utils/url'

const hemiStakeHref = '/hemi-stake'

// Matches the grid the design uses here: denser and shallower than the hero
// banner, so the crop below shows only the slopes and leaves the middle clear.
const cardColumns = 60
const cardFloorHeight = 0.1
const cardEdgeHeight = 0.86

export const HemiStakeCard = function () {
  const [hideCard, setHideCard] = useLocalStorageState(
    'portal.hide-hemi-stake-live-card',
    { defaultValue: false },
  )
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('hemi-stake.launch-card')
  const tCommon = useTranslations('common')
  const { track } = useUmami()

  if (
    hideCard ||
    networkType === 'testnet' ||
    isSamePathOrUnder(pathname, hemiStakeHref)
  ) {
    return null
  }

  const close = function (e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    setHideCard(true)
    track?.('hemi stake card - close')
  }

  return (
    <ErrorBoundary>
      <div className="group/card fixed bottom-24 right-6 z-20 sm:bottom-10">
        <Link
          href={hemiStakeHref}
          onClick={track ? () => track('hemi stake card - open') : undefined}
        >
          <div className="relative flex flex-col gap-y-3 rounded-xl border border-solid border-neutral-200 bg-white px-2 pb-3 pt-2 shadow-md hover:shadow-lg">
            <div className="relative h-20 w-[244px] overflow-hidden rounded border border-solid border-black/10 bg-white">
              <PixelPool
                className="absolute bottom-[-32.84px] left-1/2 h-[170.51px] w-[366px] -translate-x-1/2"
                columns={cardColumns}
                edgeHeight={cardEdgeHeight}
                floorHeight={cardFloorHeight}
                quietZone={null}
              />
              <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-inter-display text-[21.5px] font-bold leading-[1.1] tracking-[-0.43px] text-neutral-950">
                {t.rich('is-live', {
                  name: () => (
                    <>
                      hemi<span className="text-orange-600">Stake</span>
                    </>
                  ),
                })}
              </p>
            </div>
            <span className="flex items-center justify-center text-xxs font-medium text-neutral-500">
              {t('live-on')}
            </span>
          </div>
        </Link>
        <button
          aria-label={tCommon('close')}
          className="group/close absolute right-3.5 top-3 z-10 flex size-5 items-center justify-center md:opacity-0 md:transition-opacity md:duration-300 md:focus-visible:opacity-100 md:group-hover/card:opacity-100"
          onClick={close}
          type="button"
        >
          <CloseIcon
            className="[&>path]:group-hover/close:fill-neutral-950"
            height={16}
            width={16}
          />
        </button>
      </div>
    </ErrorBoundary>
  )
}
