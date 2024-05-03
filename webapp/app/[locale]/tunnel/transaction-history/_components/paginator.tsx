import { ChevronDoubleLeftIcon } from 'components/icons/chevronDoubleLeftIcon'
import { ChevronDoubleRightIcon } from 'components/icons/chevronDoubleRightIcon'
import { ChevronLeftIcon } from 'components/icons/chevronLeftIcon'
import { ChevronRightIcon } from 'components/icons/chevronRightIcon'
import { Tab, Tabs } from 'ui-common/components/tabs'

type Props = {
  onPageChange: (page: number) => void
  pageCount: number
  pageIndex: number
  windowSize: number
}

export const Paginator = function ({
  onPageChange,
  pageCount,
  pageIndex,
  windowSize,
}: Props) {
  const isMobile = windowSize < 1024
  const pagesToShow = isMobile ? 2 : 5

  let pagesBeforeCurrent = Math.floor((pagesToShow - 1) / 2)
  let pagesAfterCurrent = pagesToShow - 1 - pagesBeforeCurrent

  if (pageIndex - pagesBeforeCurrent < 0) {
    pagesAfterCurrent += pagesBeforeCurrent - pageIndex
    pagesBeforeCurrent = pageIndex
  }

  if (pageIndex + pagesAfterCurrent >= pageCount) {
    const extraPages = pagesAfterCurrent - (pageCount - pageIndex - 1)
    pagesAfterCurrent -= extraPages
    pagesBeforeCurrent = Math.min(pageIndex, pagesBeforeCurrent + extraPages)
  }

  const isAtStart = pageIndex === 0
  const isAtEnd = pageIndex === pageCount - 1

  return (
    <div className="mt-2 flex items-center justify-center space-x-3">
      <div
        className={`flex text-slate-500 ${
          isAtStart ? 'cursor-default opacity-40' : 'cursor-pointer opacity-100'
        }`}
      >
        <div
          className={`${
            !isAtStart
              ? 'transition-colors duration-300 hover:text-slate-950'
              : ''
          }`}
          onClick={() => onPageChange(0)}
        >
          <ChevronDoubleLeftIcon />
        </div>
        <div
          className={`${
            !isAtStart
              ? 'transition-colors duration-300 hover:text-slate-950'
              : ''
          }`}
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
        >
          <ChevronLeftIcon />
        </div>
      </div>
      <Tabs>
        {pageIndex > pagesBeforeCurrent && (
          <>
            <Tab onClick={() => onPageChange(0)} selected={pageIndex === 0}>
              1
            </Tab>
            {pageIndex > pagesBeforeCurrent + 1 && !isMobile && (
              <Tab disabled>...</Tab>
            )}
          </>
        )}
        {Array.from(
          { length: pagesBeforeCurrent + 1 + pagesAfterCurrent },
          function (_, index) {
            const pageToShow = pageIndex - pagesBeforeCurrent + index
            return (
              <Tab
                key={pageToShow}
                onClick={() => onPageChange(pageToShow)}
                selected={pageIndex === pageToShow}
              >
                {pageToShow + 1}
              </Tab>
            )
          },
        )}
        {pageIndex < pageCount - pagesAfterCurrent - 1 && (
          <>
            {pageIndex < pageCount - pagesAfterCurrent - 2 && !isMobile && (
              <Tab disabled>...</Tab>
            )}
            <Tab
              onClick={() => onPageChange(pageCount - 1)}
              selected={pageIndex === pageCount - 1}
            >
              {pageCount}
            </Tab>
          </>
        )}
      </Tabs>
      <div
        className={`flex text-slate-500 ${
          isAtEnd ? 'cursor-default opacity-40' : 'cursor-pointer opacity-100'
        }`}
      >
        <div
          className={`${
            !isAtEnd
              ? 'transition-colors duration-300 hover:text-slate-950'
              : ''
          }`}
          onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
        >
          <ChevronRightIcon />
        </div>
        <div
          className={`${
            !isAtEnd
              ? 'transition-colors duration-300 hover:text-slate-950'
              : ''
          }`}
          onClick={() => onPageChange(pageCount - 1)}
        >
          <ChevronDoubleRightIcon />
        </div>
      </div>
    </div>
  )
}
