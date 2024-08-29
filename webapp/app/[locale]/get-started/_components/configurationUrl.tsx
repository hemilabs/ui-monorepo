import { ExternalLink } from 'components/externalLink'
import { ComponentProps, useEffect, useState } from 'react'
import { Tooltip } from 'ui-common/components/tooltip'

import { Clipboard } from './icons/clipboard'

const GreenCheck = () => (
  <svg fill="none" height={9} width={10} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M8.864.954a.656.656 0 0 1 .182.91L4.671 8.427a.656.656 0 0 1-1.01.1L1.036 5.9a.656.656 0 0 1 .928-.927l2.059 2.059 3.931-5.898a.656.656 0 0 1 .91-.18Z"
      fill="#10B981"
      fillRule="evenodd"
    />
  </svg>
)

export const ConfigurationUrl = function ({
  href,
  order,
  ...props
}: { order: string } & ComponentProps<'a'>) {
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
      {copied && <GreenCheck />}
      {copied ? 'Copied' : 'Copy'}
    </div>
  )

  const onClick = function () {
    setCopied(true)
    window.navigator.clipboard.writeText(href!)
  }

  return (
    <div className={`flex cursor-pointer items-center gap-x-1 ${order}`}>
      <ExternalLink
        className="overflow-hidden text-ellipsis whitespace-nowrap text-rose-400"
        href={href}
        {...props}
      >
        {href}
      </ExternalLink>
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
          className="flex"
          onClick={href ? onClick : undefined}
          type="button"
        >
          <Clipboard />
        </button>
      </Tooltip>
    </div>
  )
}
