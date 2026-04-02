'use client'

import { Tab, Tabs } from 'components/tabs'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { MyPositionsTable } from './myPositionsTable'
import { PoolsTable } from './poolsTable'

type TabKey = 'pools' | 'positions'

export const EarnTable = function () {
  const t = useTranslations('hemi-earn.table')
  const [activeTab, setActiveTab] = useState<TabKey>('pools')

  return (
    <div className="mt-10 w-full">
      <div className="w-full md:w-fit">
        <Tabs>
          <Tab
            onClick={() => setActiveTab('pools')}
            selected={activeTab === 'pools'}
          >
            {t('pools')}
          </Tab>
          <Tab
            onClick={() => setActiveTab('positions')}
            selected={activeTab === 'positions'}
          >
            {t('my-positions')}
          </Tab>
        </Tabs>
      </div>
      <div className="mt-4">
        {activeTab === 'pools' ? <PoolsTable /> : <MyPositionsTable />}
      </div>
    </div>
  )
}
