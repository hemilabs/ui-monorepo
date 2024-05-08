import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export const useActiveTab = function () {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => setActiveTab(searchParams.get('tab')), [searchParams])

  return activeTab
}
