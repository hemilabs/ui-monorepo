import { ExternalLink } from 'components/externalLink'
import { CheckMark } from 'components/icons/checkMark'
import { ComponentProps, useEffect, useState } from 'react'
import { Tooltip } from 'ui-common/components/tooltip'

import { Clipboard } from './icons/clipboard'

export const ConfigurationUrl = function ({
  clickableLink = true,
  href,
  ...props
}: ComponentProps<'a'> & { clickableLink?: boolean }) {
  const [copied, setCopied] = useState(false)

  useEffect(
    function restoreCopied() {
      if (!copied) {
        return undefined
      }
      const timeoutId = setTimeout(() => setCopied(false), 3000)
      return () => clearTimeout(timeoutId)
    },
    [copied, setCopied],
  )

  const overlay = (
    <div className="flex items-center gap-x-1">
      {copied && <CheckMark className="[&>path]:stroke-emerald-500" />}
      {copied ? 'Copied' : 'Copy'}
    </div>
  )

  const onClick = function () {
    setCopied(true)
    window.navigator.clipboard.writeText(href!)
  }

  return (
    <>
      {clickableLink ? (
        <ExternalLink
          className="mr-auto overflow-hidden text-ellipsis whitespace-nowrap text-orange-500 hover:text-orange-700 md:basis-auto"
          href={href}
          {...props}
        >
          {href}
        </ExternalLink>
      ) : (
        <span className="mr-auto text-neutral-950">{href}</span>
      )}
      <Tooltip
        id={`copy-${href}`}
        overlay={overlay}
        overlayInnerStyle={{
          background: 'black',
          border: '0',
          borderRadius: '8px',
          color: 'white',
        }}
        trigger={['hover', 'focus']}
      >
        <button
          className="flex cursor-pointer"
          onClick={href ? onClick : undefined}
          type="button"
        >
          <Clipboard />
        </button>
      </Tooltip>
    </>
  )
}
