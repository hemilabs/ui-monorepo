'use client'

import { useOnClickOutside } from '@hemilabs/react-hooks/useOnClickOutside'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { TokenLogo } from 'components/tokenLogo'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useState } from 'react'

import { type EarnPool } from '../../../types'
import { usePoolForm } from '../_context/poolFormContext'

type Props = {
  disabled?: boolean
  pool: EarnPool
}

// Selects which deposit asset (e.g. USDC vs USDT) the user wants to send into
// the share vault. Local state only — the route stays on the share, no
// navigation. When a pool only has one asset (degenerate case), the chip is
// read-only.
export const AssetSelector = function ({ disabled, pool }: Props) {
  const { selectedAsset, setSelectedAsset } = usePoolForm()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsDropdownOpen(false),
  )

  if (pool.assets.length <= 1) {
    return <TokenSelectorReadOnly token={selectedAsset.token} />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-x-1.5 rounded-lg bg-white px-3 py-1.5 shadow-sm"
        disabled={disabled}
        onClick={() => setIsDropdownOpen(prev => !prev)}
        type="button"
      >
        <TokenLogo size="small" token={selectedAsset.token} />
        <span className="text-sm font-semibold text-neutral-950">
          {selectedAsset.token.symbol}
        </span>
        <Chevron.Bottom className="[&>path]:fill-neutral-950" />
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-20 mt-1">
          <Menu
            items={pool.assets.map(asset => ({
              content: (
                <button
                  className="-mx-2 -my-1 flex items-center gap-x-2 px-2 py-1 text-left text-sm"
                  onClick={function () {
                    setIsDropdownOpen(false)
                    setSelectedAsset(asset)
                  }}
                  type="button"
                >
                  <TokenLogo size="small" token={asset.token} />
                  {asset.token.symbol}
                </button>
              ),
              id: asset.address,
            }))}
          />
        </div>
      )}
    </div>
  )
}
